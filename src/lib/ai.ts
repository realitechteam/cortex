import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Singleton Anthropic client
// ---------------------------------------------------------------------------

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = "claude-sonnet-4-20250514";

// ---------------------------------------------------------------------------
// summarizeDocument
// ---------------------------------------------------------------------------

/**
 * Generate a concise 2–3 paragraph summary of a document using Claude.
 */
export async function summarizeDocument(
  title: string,
  content: string
): Promise<string> {
  const truncated = content.length > 30000 ? content.slice(0, 30000) : content;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are a document analysis assistant. Provide clear, concise summaries that capture the key points, main arguments, and important details.",
    messages: [
      {
        role: "user",
        content: `Please summarize the following document.\n\nTitle: ${title}\n\nContent:\n${truncated}`,
      },
    ],
  });

  return extractText(response);
}

// ---------------------------------------------------------------------------
// answerQuestion
// ---------------------------------------------------------------------------

/**
 * Answer a question based on provided context chunks, with citation tracking.
 */
export async function answerQuestion(
  question: string,
  context: string[],
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<{ answer: string; citations: number[] }> {
  // Build the numbered context section
  const contextBlock = context
    .map((chunk, i) => `[${i + 1}] ${chunk}`)
    .join("\n\n");

  const userMessage = `Here are the relevant document excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`;

  // Include up to the last 10 messages of conversation history
  const history = conversationHistory.slice(-10);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "You are Cortex, an AI document intelligence assistant. Answer questions based on the provided document context. Be precise and cite which context chunks you used. If the context doesn't contain enough information to answer, say so clearly. Format your response in markdown.",
    messages,
  });

  const answer = extractText(response);

  // Parse citation numbers — look for patterns like [1], [2], etc.
  const citationMatches = answer.matchAll(/\[(\d+)\]/g);
  const citationSet = new Set<number>();
  for (const match of citationMatches) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= context.length) {
      citationSet.add(num);
    }
  }
  const citations = Array.from(citationSet).sort((a, b) => a - b);

  return { answer, citations };
}

// ---------------------------------------------------------------------------
// generateInsights
// ---------------------------------------------------------------------------

/**
 * Analyse multiple document summaries and produce cross-document insights.
 */
export async function generateInsights(
  documents: Array<{ title: string; summary: string }>
): Promise<string> {
  const listing = documents
    .map((doc, i) => `Document ${i + 1}: ${doc.title}\nSummary: ${doc.summary}`)
    .join("\n\n---\n\n");

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "You are a research analyst. Identify patterns, connections, contradictions, and key themes across multiple documents. Provide actionable insights.",
    messages: [
      {
        role: "user",
        content: `Analyze the following document summaries and provide cross-document insights:\n\n${listing}`,
      },
    ],
  });

  return extractText(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract the text content from an Anthropic message response.
 */
function extractText(response: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("");
}
