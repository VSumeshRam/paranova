import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({
  studentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId } = Schema.parse(body);

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const prompt = `Invent a fascinating, highly specific, and slightly unusual cross-disciplinary academic topic (e.g. "The Physics of Black Hole Thermodynamics", "Cognitive Biases in Algorithmic Trading", "Mycology in Deep Space Ecosystems").
Return your answer AS A PURE JSON OBJECT strictly following this schema:
{
  "label": "The name of the topic",
  "description": "A 1-2 sentence compelling description of what this topic entails and why it's interesting"
}`;

    const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await llmRes.json();
    let content = data.candidates[0].content.parts[0].text;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    const nodeId = `NODE_RANDOM_${Date.now()}`;

    const node = await prisma.knowledgeNode.create({
      data: {
        id: nodeId,
        label: parsed.label,
        tier: 5,
        description: parsed.description,
        isAtomic: true,
      }
    });

    return NextResponse.json({ nodeId: node.id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate random topic' }, { status: 500 });
  }
}
