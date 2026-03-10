import { NextRequest, NextResponse } from 'next/server';
import { getDocument, deleteDocument, getChunksByDocument } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = getDocument(params.id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const chunks = getChunksByDocument(params.id);

    return NextResponse.json({
      ...document,
      chunksCount: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = getDocument(params.id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Try to delete the uploaded file (ignore errors if it doesn't exist)
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, `${params.id}_${document.filename}`);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist — that's fine
    }

    deleteDocument(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
