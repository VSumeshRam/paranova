import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const nodes = await prisma.knowledgeNode.findMany();
    const edges = await prisma.prerequisite.findMany();
    
    const masteryStatesArray = await prisma.masteryState.findMany({
      where: { studentId: params.studentId },
    });

    // Convert to map for easy lookup
    const masteryStates: Record<string, any> = {};
    masteryStatesArray.forEach(state => {
      masteryStates[state.nodeId] = state;
    });

    // Get the latest interaction to extract active diagnostics
    const latestInteraction = await prisma.interactionLog.findFirst({
      where: { studentId: params.studentId },
      orderBy: { createdAt: 'desc' },
      include: { problem: true }
    });

    let activeNodeId = null;
    let diagnosedGapNodeId = null;
    let activeAntiPatternNodeId = null;

    if (latestInteraction) {
      activeNodeId = latestInteraction.problem.nodeId;
      diagnosedGapNodeId = latestInteraction.diagnosedGapNodeId;
      
      if (latestInteraction.misconceptionLabel) {
        activeAntiPatternNodeId = activeNodeId;
      }
    }

    return NextResponse.json({
      nodes,
      edges,
      masteryStates,
      activeNodeId,
      diagnosedGapNodeId,
      activeAntiPatternNodeId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
