import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { nodeId, studentId } = await req.json();

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
    }

    const node = await prisma.knowledgeNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Fetch the student's previous misconception if they have failed this before
    let misconceptionContext = '';
    if (studentId) {
      const mastery = await prisma.masteryState.findUnique({
        where: { studentId_nodeId: { studentId, nodeId } },
      });
      if (mastery && mastery.misconceptionLabel) {
        misconceptionContext = `\nCRITICAL CONTEXT: This student previously failed this topic due to the following misconception: "${mastery.misconceptionLabel}". Specifically design this new question to test whether they have overcome this exact misunderstanding.`;
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      // Mock response if no key is provided
      const mockQuestions = Array.from({ length: 10 }).map((_, i) => ({
        id: `mock-problem-${Date.now()}-${i}`,
        nodeId: node.id,
        textPrompt: `[MOCK ${i + 1}] Explain the concept of ${node.label}: ${node.description}`,
        expectedAnswer: 'mock answer',
        antiPatterns: JSON.stringify({ 'wrong': 'MOCK_MISCONCEPTION' }),
      }));
      return NextResponse.json(mockQuestions);
    }

    // Call Gemini API
    const prompt = `You are a strict, highly intelligent expert backend system for an adaptive learning platform.
Generate exactly 10 distinct, non-repetitive multiple-choice questions testing the student's mastery of the topic: "${node.label}" (Description: ${node.description}).
${misconceptionContext}

Your response must be a JSON array of 10 objects. Do not wrap it in any other JSON object. Each object in the array MUST strictly follow this schema:
{
  "textPrompt": "The actual question text (can include scenario, math, code, or context).",
  "expectedAnswer": "The exact correct answer as a short string",
  "antiPatterns": {
    "A highly plausible wrong answer (distractor 1)": "UPPERCASE_SNAKE_CASE_MISCONCEPTION_LABEL_1",
    "A highly plausible wrong answer (distractor 2)": "UPPERCASE_SNAKE_CASE_MISCONCEPTION_LABEL_2",
    "A highly plausible wrong answer (distractor 3)": "UPPERCASE_SNAKE_CASE_MISCONCEPTION_LABEL_3"
  }
}
Return ONLY the raw JSON array. Do not use markdown wrappers.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error details:', data);
      throw new Error(`Gemini API call failed: ${response.statusText}`);
    }
    
    let content = data.candidates[0].content.parts[0].text;
    
    // Clean up potential markdown formatting just in case
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedArray = JSON.parse(content);

    if (!Array.isArray(parsedArray)) {
      throw new Error("LLM did not return a JSON array");
    }

    const mappedQuestions = parsedArray.map((parsed: any, idx: number) => ({
      id: `dynamic-${Date.now()}-${idx}`,
      nodeId: node.id,
      textPrompt: parsed.textPrompt,
      expectedAnswer: parsed.expectedAnswer,
      antiPatterns: JSON.stringify(parsed.antiPatterns),
    }));

    return NextResponse.json(mappedQuestions);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
