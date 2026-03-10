import { NextRequest, NextResponse } from 'next/server';
import { getConversation, deleteConversation } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const conversation = getConversation(params.id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const conversation = getConversation(params.id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    deleteConversation(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
