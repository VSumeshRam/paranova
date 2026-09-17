import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    const problem = await prisma.problem.findFirst({
      where: { nodeId: params.nodeId },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Don't send the expectedAnswer or antiPatterns to the client directly!
    const { expectedAnswer, antiPatterns, ...safeProblem } = problem;

    return NextResponse.json(safeProblem);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
