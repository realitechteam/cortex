import { NextRequest, NextResponse } from 'next/server';
import { getConversations, createConversation } from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const conversations = getConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body as { title?: string };

    const conversationId = uuid();
    const conversation = createConversation(conversationId, title);

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
