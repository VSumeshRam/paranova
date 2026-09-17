import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const OnboardingRequest = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
  age: z.number().min(3).max(100),
  goals: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OnboardingRequest.parse(body);

    // Check if user exists
    const existing = await prisma.student.findUnique({
      where: { username: parsed.username }
    });

    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
    }

    let lexicalBaseline = 'BEGINNER';
    if (parsed.age > 15) lexicalBaseline = 'ADVANCED';
    else if (parsed.age > 10) lexicalBaseline = 'INTERMEDIATE';

    // Create Student record in Prisma
    const student = await prisma.student.create({
      data: {
        username: parsed.username,
        password: parsed.password, // In production, Hash this!
        age: parsed.age,
        goals: parsed.goals,
        interests: '',
        lexicalBaseline,
        preferredMode: 'TEXT',
      },
    });

    return NextResponse.json({
      studentId: student.id,
      message: `Profile created. Your baseline is ${lexicalBaseline}.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
