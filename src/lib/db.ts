import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface Document {
  id: string;
  title: string;
  filename: string;
  content: string;
  file_size: number;
  mime_type: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  metadata: string; // JSON string
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: string; // JSON string
  created_at: string;
}

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------

let db: Database.Database | null = null;

function initDb(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || "./data/cortex.db";
  const dir = path.dirname(dbPath);

  fs.mkdirSync(dir, { recursive: true });

  const instance = new Database(dbPath);

  // Enable WAL mode for better concurrent reads
  instance.pragma("journal_mode = WAL");

  // Create tables
  instance.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT DEFAULT 'text/plain',
      summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      metadata TEXT DEFAULT '{}',
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT 'New Conversation',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      sources TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // Enable foreign key enforcement
  instance.pragma("foreign_keys = ON");

  return instance;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function getDb(): Database.Database {
  if (!db) {
    db = initDb();
  }
  return db;
}

// ---- Documents ------------------------------------------------------------

export function insertDocument(doc: {
  id: string;
  title: string;
  filename: string;
  content: string;
  file_size: number;
  mime_type: string;
}): Document {
  const stmt = getDb().prepare(`
    INSERT INTO documents (id, title, filename, content, file_size, mime_type)
    VALUES (@id, @title, @filename, @content, @file_size, @mime_type)
  `);
  stmt.run(doc);
  return getDocument(doc.id)!;
}

export function getDocument(id: string): Document | undefined {
  const stmt = getDb().prepare("SELECT * FROM documents WHERE id = ?");
  return stmt.get(id) as Document | undefined;
}

export function getAllDocuments(): Document[] {
  const stmt = getDb().prepare(
    "SELECT * FROM documents ORDER BY created_at DESC"
  );
  return stmt.all() as Document[];
}

export function deleteDocument(id: string): void {
  const stmt = getDb().prepare("DELETE FROM documents WHERE id = ?");
  stmt.run(id);
}

export function updateDocumentSummary(id: string, summary: string): void {
  const stmt = getDb().prepare(
    "UPDATE documents SET summary = ?, updated_at = datetime('now') WHERE id = ?"
  );
  stmt.run(summary, id);
}

// ---- Chunks ---------------------------------------------------------------

export function insertChunks(
  chunks: Array<{ id: string; document_id: string; content: string; chunk_index: number }>
): void {
  const stmt = getDb().prepare(`
    INSERT INTO chunks (id, document_id, content, chunk_index)
    VALUES (@id, @document_id, @content, @chunk_index)
  `);

  const insertMany = getDb().transaction(
    (items: typeof chunks) => {
      for (const item of items) {
        stmt.run(item);
      }
    }
  );

  insertMany(chunks);
}

export function getChunksByDocument(documentId: string): Chunk[] {
  const stmt = getDb().prepare(
    "SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC"
  );
  return stmt.all(documentId) as Chunk[];
}

export function getAllChunks(): Chunk[] {
  const stmt = getDb().prepare("SELECT * FROM chunks");
  return stmt.all() as Chunk[];
}

// ---- Conversations --------------------------------------------------------

export function createConversation(id: string, title?: string): Conversation {
  if (title) {
    const stmt = getDb().prepare(
      "INSERT INTO conversations (id, title) VALUES (?, ?)"
    );
    stmt.run(id, title);
  } else {
    const stmt = getDb().prepare("INSERT INTO conversations (id) VALUES (?)");
    stmt.run(id);
  }
  return getDb().prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Conversation;
}

export function getConversations(): Conversation[] {
  const stmt = getDb().prepare(
    "SELECT * FROM conversations ORDER BY created_at DESC"
  );
  return stmt.all() as Conversation[];
}

export function getConversation(
  id: string
): (Conversation & { messages: Message[] }) | undefined {
  const conv = getDb()
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(id) as Conversation | undefined;

  if (!conv) return undefined;

  const messages = getMessages(id);
  return { ...conv, messages };
}

// ---- Messages -------------------------------------------------------------

export function addMessage(msg: {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string;
}): Message {
  const stmt = getDb().prepare(`
    INSERT INTO messages (id, conversation_id, role, content, sources)
    VALUES (@id, @conversation_id, @role, @content, @sources)
  `);
  stmt.run({
    ...msg,
    sources: msg.sources ?? "[]",
  });
  return getDb()
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(msg.id) as Message;
}

export function getMessages(conversationId: string): Message[] {
  const stmt = getDb().prepare(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
  );
  return stmt.all(conversationId) as Message[];
}

export function deleteConversation(id: string): void {
  const stmt = getDb().prepare("DELETE FROM conversations WHERE id = ?");
  stmt.run(id);
}
