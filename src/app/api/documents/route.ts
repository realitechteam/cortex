import { NextRequest, NextResponse } from 'next/server';
import { getAllDocuments, insertDocument, insertChunks, updateDocumentSummary } from '@/lib/db';
import { chunkText } from '@/lib/chunker';
import { summarizeDocument } from '@/lib/ai';
import { v4 as uuid } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

export async function GET() {
  try {
    const documents = getAllDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const content = Buffer.from(arrayBuffer).toString('utf-8');

    // Generate document ID
    const documentId = uuid();

    // Save file to uploads directory
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${documentId}_${file.name}`);
    await writeFile(filePath, Buffer.from(arrayBuffer));

    // Insert document into DB
    const document = insertDocument({
      id: documentId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name,
      content,
      file_size: file.size,
      mime_type: file.type,
    });

    // Chunk the content and insert chunks
    const textChunks = chunkText(content);
    const chunkRecords = textChunks.map((chunkContent, index) => ({
      id: uuid(),
      document_id: documentId,
      content: chunkContent,
      chunk_index: index,
    }));

    if (chunkRecords.length > 0) {
      insertChunks(chunkRecords);
    }

    // Kick off summarization in the background (don't await)
    summarizeDocument(document.title, content)
      .then((summary) => {
        updateDocumentSummary(documentId, summary);
      })
      .catch((err) => {
        console.error(`Failed to summarize document ${documentId}:`, err);
      });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
