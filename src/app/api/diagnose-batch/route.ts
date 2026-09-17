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

    const mappedResults = results.map((r: any, i: number) => ({ ...r, qNum: i + 1 }));
    const totalCorrect = mappedResults.filter((r: any) => r.isCorrect).length;
    const wrongResults = mappedResults.filter((r: any) => !r.isCorrect);

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
    let learningMap = [];
    
    if (wrongResults.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const wrongAnswersContext = wrongResults.map((r: any) => 
            `Question ${r.qNum}:\nPrompt: "${r.textPrompt}"\nStudent Answered: "${r.submission}"\nCorrect Answer: "${r.expectedAnswer}"`
          ).join('\n\n');

        const prompt = `The student just completed a 10-question quiz on "${node.label}" (${node.description}) and made ${wrongResults.length} mistakes.
Here are the specific mistakes they made:

${wrongAnswersContext}

Analyze their mistakes and provide a comprehensive 2-paragraph study remediation report addressing their fundamental misunderstandings. 
Then, on a new line, provide exactly 3 bullet points of highly specific learning materials (e.g. YouTube search terms, specific textbook concepts to Google, or prerequisite topics). Format the bullets with a '-' prefix.
Finally, at the very end of your response, output a JSON array of objects mapping the EXACT failed Question Numbers to the specific micro-topic the student must relearn to fix that mistake. Enclose the JSON array in <LEARNING_MAP> tags.
Example format:
<LEARNING_MAP>
[
  { "qNum": 3, "topicToRelearn": "Thermodynamics Law 2", "reason": "Failed to understand entropy" },
  { "qNum": 7, "topicToRelearn": "Kinetic Energy", "reason": "Confused formula with potential energy" }
]
</LEARNING_MAP>`;

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

  // Extract <LEARNING_MAP> array if it exists
  const mapMatch = remediationReport.match(/<LEARNING_MAP>([\s\S]*?)<\/LEARNING_MAP>/);
  if (mapMatch) {
    try {
      learningMap = JSON.parse(mapMatch[1]);
    } catch (e) { console.error("Failed to parse AI learning map", e); }
    // Remove the ugly tag from the user-facing report
    remediationReport = remediationReport.replace(/<LEARNING_MAP>[\s\S]*?<\/LEARNING_MAP>/, '').trim();
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

  return NextResponse.json({
    score: totalCorrect,
    total: results.length,
    newMasteryProbability: newPMastery,
    isMastered,
    remediationReport,
    learningMap
  });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
