import { NextRequest, NextResponse } from 'next/server';
import { getAllChunks, addMessage, getMessages, createConversation, getConversation } from '@/lib/db';
import { answerQuestion } from '@/lib/ai';
import { searchChunks } from '@/lib/vectors';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId: existingConversationId, message } = body as {
      conversationId?: string;
      message: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Resolve or create a conversation
    let conversationId: string;
    if (existingConversationId) {
      const existing = getConversation(existingConversationId);
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      conversationId = existingConversationId;
    } else {
      const title = message.slice(0, 50);
      conversationId = uuid();
      createConversation(conversationId, title);
    }

    // 2. Save the user message
    const userMessageId = uuid();
    addMessage({
      id: userMessageId,
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

    // 3. Get all chunks from DB
    const allChunks = getAllChunks();

    // 4. Search for relevant chunks (top 5)
    const searchResults = searchChunks(message, allChunks, 5);

    // 5. Get conversation history for context
    const conversationMessages = getMessages(conversationId);
    const conversationHistory = conversationMessages
      .filter((m) => m.id !== userMessageId) // exclude the message we just added
      .map((m) => ({ role: m.role, content: m.content }));

    // 6. Call answerQuestion with question, relevant chunks, and history
    const contextContents = searchResults.map((r) => r.content);
    const { answer, citations } = await answerQuestion(
      message,
      contextContents,
      conversationHistory,
    );

    // 7. Build sources from cited chunks
    const sources = citations.map((citationIndex) => {
      const chunk = searchResults[citationIndex - 1]; // citations are 1-indexed
      return chunk
        ? { chunkId: chunk.chunkId, documentId: chunk.documentId }
        : null;
    }).filter(Boolean);

    // 8. Save the assistant message
    const assistantMessageId = uuid();
    const assistantMessage = addMessage({
      id: assistantMessageId,
      conversation_id: conversationId,
      role: 'assistant',
      content: answer,
      sources: JSON.stringify(sources),
    });

    return NextResponse.json({
      conversationId,
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        sources,
      },
      relevantChunks: searchResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process chat message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
