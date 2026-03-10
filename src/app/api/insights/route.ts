import { NextRequest, NextResponse } from 'next/server';
import { generateInsights } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json();

    if (!documents || !Array.isArray(documents) || documents.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 documents with summaries are required' },
        { status: 400 }
      );
    }

    // Validate each document has the required fields
    for (const doc of documents) {
      if (!doc.title || !doc.summary) {
        return NextResponse.json(
          { error: 'Each document must have a title and summary' },
          { status: 400 }
        );
      }
    }

    const insights = await generateInsights(documents);

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Insights generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
