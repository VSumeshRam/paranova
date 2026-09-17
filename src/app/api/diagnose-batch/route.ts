import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateBKT, BKT_PARAMS, calculateCFS } from '@/lib/bkt';
import { z } from 'zod';

const BatchDiagnoseSchema = z.object({
  studentId: z.string().optional(),
  nodeId: z.string(),
  results: z.array(z.object({
    isCorrect: z.boolean(),
    expectedAnswer: z.string(),
    submission: z.string(),
    textPrompt: z.string(),
  })),
  telemetry: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, nodeId, results } = BatchDiagnoseSchema.parse(body);

    const node = await prisma.knowledgeNode.findUnique({
      where: { id: nodeId },
    });
    if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    const totalCorrect = results.filter((r) => r.isCorrect).length;
    const wrongResults = results.filter((r) => !r.isCorrect);

    let newPMastery = BKT_PARAMS.P_L0;
    let isMastered = false;

    if (studentId) {
      let masteryState = await prisma.masteryState.findUnique({
        where: { studentId_nodeId: { studentId, nodeId } }
      });

      if (!masteryState) {
        masteryState = await prisma.masteryState.create({
          data: { studentId, nodeId, pMastery: BKT_PARAMS.P_L0 }
        });
      }

      // Apply BKT sequentially for all 10 questions
      newPMastery = masteryState.pMastery;
      for (const res of results) {
        newPMastery = calculateBKT(newPMastery, res.isCorrect ? 1 : 0);
      }
      isMastered = newPMastery >= BKT_PARAMS.MASTERY_THRESHOLD;

      await prisma.masteryState.update({
        where: { id: masteryState.id },
        data: { pMastery: newPMastery, isMastered },
      });
    }

    let remediationReport = 'Great job! You showed strong mastery of this topic.';
    
    if (wrongResults.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const wrongAnswersContext = wrongResults.map((r, i) => 
            `Mistake ${i + 1}:\nQuestion: "${r.textPrompt}"\nStudent Answered: "${r.submission}"\nCorrect Answer: "${r.expectedAnswer}"`
          ).join('\n\n');

          const prompt = `The student just completed a 10-question quiz on "${node.label}" (${node.description}) and made ${wrongResults.length} mistakes.
Here are the specific mistakes they made:

${wrongAnswersContext}

Analyze their mistakes and provide a comprehensive 2-paragraph study remediation report addressing their fundamental misunderstandings. 
Then, on a new line, provide exactly 3 bullet points of highly specific learning materials (e.g. YouTube search terms, specific textbook concepts to Google, or prerequisite topics). Format the bullets with a '-' prefix.`;

          const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          
          const data = await llmRes.json();
          remediationReport = data.candidates[0].content.parts[0].text;
        } catch (e) {
          console.error("LLM batch suggestion failed", e);
          remediationReport = `You missed ${wrongResults.length} questions. Please review the core concepts of ${node.label}.`;
        }
      } else {
        remediationReport = `You missed ${wrongResults.length} questions. Please review the core concepts of ${node.label}.`;
      }
    }

    if (studentId) {
      await prisma.sessionReport.create({
        data: {
          studentId,
          nodeId,
          score: totalCorrect,
          totalQuestions: results.length,
          remediationText: remediationReport
        }
      });
    }

    // Fetch prerequisite graph to show what foundational classes to re-take
    const prerequisites = await prisma.prerequisite.findMany({
      where: { targetId: nodeId },
      include: { source: true }
    });

    const prerequisiteGraph = {
      target: { id: node.id, label: node.label },
      sources: prerequisites.map(p => ({ id: p.source.id, label: p.source.label }))
    };

    return NextResponse.json({
      score: totalCorrect,
      total: results.length,
      newMasteryProbability: newPMastery,
      isMastered,
      remediationReport,
      prerequisiteGraph
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
