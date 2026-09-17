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
      return NextResponse.json({
        id: 'mock-problem-' + Date.now(),
        nodeId: node.id,
        textPrompt: `[MOCK] Explain the concept of ${node.label}: ${node.description}`,
        expectedAnswer: 'mock answer',
        antiPatterns: JSON.stringify({ 'wrong': 'MOCK_MISCONCEPTION' }),
      });
    }

    // Call Gemini API
    const prompt = `You are a cognitive diagnostic AI. Generate a single quiz question to test the user's understanding of the following atomic subject:
    Topic: ${node.label}
    Description: ${node.description}
    ${misconceptionContext}
    
    Return ONLY a valid JSON object with the following schema, and no markdown formatting or extra text:
{
  "textPrompt": "The question text",
  "expectedAnswer": "The exact correct answer (short)",
  "antiPatterns": {
    "A common wrong answer": "THE_UNDERLYING_MISCONCEPTION_LABEL",
    "Another common wrong answer": "ANOTHER_MISCONCEPTION_LABEL"
  }
}`;

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
    
    const parsed = JSON.parse(content);

    // Generate a temporary ID (since we don't save it to DB to keep it perfectly dynamic)
    return NextResponse.json({
      id: 'dynamic-' + Date.now(),
      nodeId: node.id,
      textPrompt: parsed.textPrompt,
      expectedAnswer: parsed.expectedAnswer,
      antiPatterns: JSON.stringify(parsed.antiPatterns),
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
