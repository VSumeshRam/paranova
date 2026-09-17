import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic cannot be empty' }, { status: 400 });
    }

    // Ensure a "Custom Explorations" macro node exists
    let customRoot = await prisma.knowledgeNode.findUnique({
      where: { id: 'MACRO_CUSTOM' }
    });

    if (!customRoot) {
      customRoot = await prisma.knowledgeNode.create({
        data: {
          id: 'MACRO_CUSTOM',
          label: 'Custom Explorations',
          tier: 0,
          description: 'Topics dynamically created by users.',
          isAtomic: false,
          parentDomainId: null,
        }
      });
    }

    // Create the new atomic node for this custom search
    const nodeId = `NODE_CUSTOM_${Date.now()}`;
    const newNode = await prisma.knowledgeNode.create({
      data: {
        id: nodeId,
        label: topic.trim(),
        tier: 1,
        description: `User-generated exploration of ${topic}`,
        isAtomic: true,
        parentDomainId: 'MACRO_CUSTOM',
      }
    });

    return NextResponse.json({ nodeId: newNode.id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create custom topic' }, { status: 500 });
  }
}
