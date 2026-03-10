// ---------------------------------------------------------------------------
// Text chunking utility
// ---------------------------------------------------------------------------

export interface ChunkOptions {
  /** Target size for each chunk in characters. Default: 1000 */
  chunkSize?: number;
  /** Number of overlapping characters between consecutive chunks. Default: 200 */
  overlap?: number;
}

const MIN_CHUNK_LENGTH = 100;

/**
 * Split `text` into overlapping chunks suitable for embedding / retrieval.
 *
 * The splitter tries to break at natural boundaries in this priority order:
 *   1. Paragraph breaks (`\n\n`)
 *   2. Sentence boundaries (`.` `!` `?` followed by whitespace)
 *   3. Word boundaries (spaces)
 *
 * Every chunk except the last will be at least `MIN_CHUNK_LENGTH` characters.
 */
export function chunkText(
  text: string,
  options?: ChunkOptions
): string[] {
  const chunkSize = options?.chunkSize ?? 1000;
  const overlap = options?.overlap ?? 200;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // If the entire text fits in one chunk, return it directly.
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // If we've reached the end of the text, take the remainder.
    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // Try to find a good split point within the window [start, end].
    const splitPoint = findSplitPoint(text, start, end);
    const chunk = text.slice(start, splitPoint);

    // Only emit chunks that meet the minimum length, unless it is the last
    // piece of text remaining.
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }

    // Advance the cursor, applying overlap.
    start = splitPoint - overlap;
    if (start < 0) start = 0;

    // Guard against making no progress (e.g. very long word with no breaks).
    if (start >= splitPoint) {
      start = splitPoint;
    }
  }

  // Post-process: merge the last chunk into the previous one if it is too
  // short (unless it is the only chunk).
  if (
    chunks.length > 1 &&
    chunks[chunks.length - 1].length < MIN_CHUNK_LENGTH
  ) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] += last;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Scan backwards from `end` looking for the best natural break point.
 * Returns the index at which to cut.
 */
function findSplitPoint(text: string, start: number, end: number): number {
  // 1. Paragraph break (\n\n) — search backwards from end
  const paraIdx = text.lastIndexOf("\n\n", end - 1);
  if (paraIdx > start + MIN_CHUNK_LENGTH) {
    return paraIdx + 2; // include the double-newline in the preceding chunk
  }

  // 2. Sentence boundary (. ! ? followed by space or newline)
  const sentenceIdx = findLastSentenceBoundary(text, start, end);
  if (sentenceIdx > start + MIN_CHUNK_LENGTH) {
    return sentenceIdx;
  }

  // 3. Word boundary (space)
  const spaceIdx = text.lastIndexOf(" ", end - 1);
  if (spaceIdx > start + MIN_CHUNK_LENGTH) {
    return spaceIdx + 1; // split after the space
  }

  // 4. Fallback: hard cut at end
  return end;
}

/**
 * Walk backwards from `end` to find the position just after a sentence-ending
 * punctuation mark followed by whitespace.
 */
function findLastSentenceBoundary(
  text: string,
  start: number,
  end: number
): number {
  for (let i = end - 1; i > start + MIN_CHUNK_LENGTH; i--) {
    const ch = text[i - 1];
    if ((ch === "." || ch === "!" || ch === "?") && /\s/.test(text[i])) {
      return i; // position right after the punctuation
    }
  }
  return -1;
}
