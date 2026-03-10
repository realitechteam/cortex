import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocumentSummary } from '@/lib/db';
import { summarizeDocument } from '@/lib/ai';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = getDocument(params.id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const summary = await summarizeDocument(document.title, document.content);
    updateDocumentSummary(params.id, summary);

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
