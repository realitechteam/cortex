// ---------------------------------------------------------------------------
// Simple in-memory TF-IDF cosine similarity search
// ---------------------------------------------------------------------------
// This is intentionally simple — a production system would use embeddings and
// a vector DB, but TF-IDF cosine similarity works well enough for an MVP.
// ---------------------------------------------------------------------------

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Tokenizer & TF helpers
// ---------------------------------------------------------------------------

/**
 * Simple tokenizer: lowercase, split on non-alphanumeric characters,
 * and filter out tokens shorter than 3 characters.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

/**
 * Calculate term frequency for a token array.
 * Each term's frequency is normalised by the total number of tokens.
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  // Normalise by total token count
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/**
 * Calculate cosine similarity between two term-frequency maps.
 */
function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, weightA] of a) {
    magA += weightA * weightA;
    const weightB = b.get(term);
    if (weightB !== undefined) {
      dot += weightA * weightB;
    }
  }

  for (const weightB of b.values()) {
    magB += weightB * weightB;
  }

  if (magA === 0 || magB === 0) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------

/**
 * Search chunks by TF-based cosine similarity to the query.
 *
 * Returns up to `topK` results sorted by descending score, filtering out
 * any result with a score below 0.01.
 */
export function searchChunks(
  query: string,
  chunks: Array<{ id: string; document_id: string; content: string }>,
  topK: number = 5
): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTF = termFrequency(queryTokens);

  const scored: SearchResult[] = [];

  for (const chunk of chunks) {
    const chunkTokens = tokenize(chunk.content);
    if (chunkTokens.length === 0) continue;

    const chunkTF = termFrequency(chunkTokens);
    const score = cosineSimilarity(queryTF, chunkTF);

    if (score >= 0.01) {
      scored.push({
        chunkId: chunk.id,
        documentId: chunk.document_id,
        content: chunk.content,
        score,
      });
    }
  }

  // Sort descending by score, then take top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
