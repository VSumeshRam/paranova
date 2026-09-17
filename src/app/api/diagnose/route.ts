import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateBKT, calculateCFS, BKT_PARAMS } from '@/lib/bkt';

const DiagnoseRequest = z.object({
  studentId: z.string(),
  problemId: z.string(),
  submission: z.string(),
  telemetry: z.object({
    timeToFirstAction: z.number(),
    hesitationPauses: z.number(),
    answerFlips: z.number(),
    activeModality: z.enum(["TEXT", "VISUAL", "AUDIO"]),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, problemId, submission, telemetry } = DiagnoseRequest.parse(body);

    let expectedAnswer = submission; // default to correct for mock
    let antiPatternsObj: Record<string, string> = {};
    let nodeLabel = 'the topic';
    let nodeDesc = '';

    if (problemId.startsWith('dynamic-') || problemId.startsWith('mock-')) {
      // For dynamic problems, we expect the client to pass the expected answer and anti-patterns, 
      // or we can just fetch the node and use the client's telemetry.
      // Wait, passing expectedAnswer from client is a security risk in production, but necessary for truly dynamic ephemeral problems without storing them.
      expectedAnswer = body.expectedAnswer || 'mock answer';
      antiPatternsObj = JSON.parse(body.antiPatterns || '{}');
      
      const node = await prisma.knowledgeNode.findUnique({ where: { id: body.nodeId } });
      if (node) {
        nodeLabel = node.label;
        nodeDesc = node.description;
      }
    } else {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        include: { node: true },
      });
      if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
      expectedAnswer = problem.expectedAnswer;
      antiPatternsObj = JSON.parse(problem.antiPatterns || '{}');
      nodeLabel = problem.node.label;
      nodeDesc = problem.node.description;
    }

    const isCorrect = expectedAnswer.trim().toLowerCase() === submission.trim().toLowerCase();
    
    const cfs = calculateCFS(
      telemetry.timeToFirstAction, 
      telemetry.hesitationPauses, 
      telemetry.answerFlips
    );

    // Get current mastery state
    let masteryState = await prisma.masteryState.findUnique({
      where: { studentId_nodeId: { studentId, nodeId: body.nodeId } }
    });

    if (!masteryState) {
      masteryState = await prisma.masteryState.create({
        data: {
          studentId,
          nodeId: body.nodeId,
          pMastery: BKT_PARAMS.P_L0,
        }
      });
    }

    // BKT Update
    const newPMastery = calculateBKT(masteryState.pMastery, isCorrect ? 1 : 0);
    const isMastered = newPMastery >= BKT_PARAMS.MASTERY_THRESHOLD;

    await prisma.masteryState.update({
      where: { id: masteryState.id },
      data: { pMastery: newPMastery, isMastered },
    });

    let diagnosedGapNodeId: string | null = null;
    let misconceptionLabel: string | null = null;
    let recommendModalitySwitch: string | null = null;
    let studySuggestion = 'Review the material and try again.';

    if (!isCorrect) {
      if (antiPatternsObj[submission]) {
        misconceptionLabel = antiPatternsObj[submission];
      } else {
        misconceptionLabel = 'UNKNOWN_CAUSAL_MISCONCEPTION';
      }

      // Generate LLM Study Suggestion if API Key exists
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ 
                  text: `The student got a question wrong about ${nodeLabel}. They answered "${submission}" instead of "${expectedAnswer}". 
Provide a 1-sentence encouraging study suggestion specifically addressing this mistake.
Then, provide exactly 2 bullet points of specific learning material recommendations (e.g. YouTube search terms, specific concepts to Google, or textbook chapters). Use a '-' for each bullet point.`
                }] 
              }]
            })
          });
          const data = await llmRes.json();
          studySuggestion = data.candidates[0].content.parts[0].text;
        } catch (e) {
          console.error("LLM suggestion failed", e);
        }
      } else {
        studySuggestion = `It looks like you answered "${submission}". A good review of ${nodeLabel} focusing on ${nodeDesc} might help clarify this!`;
      }

      // 2. Backward Prerequisite Traversal
      const prerequisites = await prisma.prerequisite.findMany({
        where: { targetId: body.nodeId },
        include: { source: true },
      });

      for (const prereq of prerequisites) {
        const prereqState = await prisma.masteryState.findUnique({
          where: { studentId_nodeId: { studentId, nodeId: prereq.sourceId } }
        });
        if (!prereqState || prereqState.pMastery < 0.70) {
          diagnosedGapNodeId = prereq.sourceId;
          break;
        }
      }

      if (telemetry.activeModality === 'TEXT' && cfs >= 0.65) {
        recommendModalitySwitch = 'VISUAL';
      }
    }

    // Persist Interaction Log (Only if it's not a dynamic problem, or we save it with a null problemId)
    // We'll save dynamic interactions with problemId = "dynamic-xyz" (it will fail foreign key constraint if problemId isn't real)
    // Wait, problemId is a foreign key to Problem. So we can't save "dynamic-xyz" into InteractionLog.problemId.
    // Let's make problemId optional in Prisma, or just don't log dynamic problems for now, or create a dummy problem record.
    // For now, if dynamic, let's just create a quick dummy problem in DB so FK works.
    let logProblemId = problemId;
    if (problemId.startsWith('dynamic-') || problemId.startsWith('mock-')) {
       const dummy = await prisma.problem.create({
         data: {
           nodeId: body.nodeId,
           textPrompt: body.textPrompt || 'Dynamic Prompt',
           visualDataJson: '{}',
           audioPromptText: '',
           expectedAnswer: expectedAnswer,
           antiPatterns: body.antiPatterns || '{}',
         }
       });
       logProblemId = dummy.id;
    }

    await prisma.interactionLog.create({
      data: {
        studentId,
        problemId: logProblemId,
        modalityUsed: telemetry.activeModality,
        isCorrect,
        userSubmission: submission,
        timeToFirstAction: telemetry.timeToFirstAction,
        hesitationPauses: telemetry.hesitationPauses,
        answerFlips: telemetry.answerFlips,
        cognitiveFriction: cfs,
        diagnosedGapNodeId,
        misconceptionLabel,
      }
    });

    return NextResponse.json({
      correct: isCorrect,
      newMasteryProbability: newPMastery,
      isMastered,
      cfs,
      diagnosedGapNodeId,
      misconceptionLabel,
      recommendModalitySwitch,
      remediationString: isCorrect 
        ? 'Great job! You got it right.' 
        : studySuggestion
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
