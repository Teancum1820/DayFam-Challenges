type ThoughtRow = { id: number; display_name: string; passage: string; thought: string; created_at: string };
const columns = 'id, display_name, passage, thought, created_at';
const pageSize = 24;
const post = (row: ThoughtRow) => ({
  id: row.id, name: row.display_name, passage: row.passage, thought: row.thought, createdAt: row.created_at
});

export async function listThoughts(db: D1Database, query: URLSearchParams) {
  const raw = query.get('before') ?? query.get('after');
  const cursor = raw === null ? null : Number(raw);
  if ((query.has('before') && query.has('after')) ||
      (raw !== null && (!/^\d+$/.test(raw) || !Number.isSafeInteger(cursor) || cursor! < 1))) return null;
  const forward = query.has('after');
  const where = cursor === null ? '' : forward ? 'WHERE id > ?' : 'WHERE id < ?';
  const order = forward ? 'ASC' : 'DESC';
  const args = cursor === null ? [pageSize + 1] : [cursor, pageSize + 1];
  const { results } = await db.prepare(
    `SELECT ${columns} FROM scripture_thoughts ${where} ORDER BY id ${order} LIMIT ?`
  ).bind(...args).all<ThoughtRow>();
  const thoughts = results.slice(0, pageSize).map(post);
  return { thoughts, hasMore: results.length > pageSize };
}

export function validateThought(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const { name, passage, thought, submissionId } = input as Record<string, unknown>;
  const cleanLine = (value: unknown, max: number) => {
    if (typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value) || value.trim().length > max) return '';
    return value.trim();
  };
  const cleanName = cleanLine(name, 32);
  const cleanPassage = cleanLine(passage, 80);
  const cleanThought = typeof thought === 'string' ? thought.trim() : '';
  if (!cleanName || !cleanPassage || !cleanThought || cleanThought.length > 1000 ||
      /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(cleanThought) ||
      typeof submissionId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(submissionId)) return null;
  return { name: cleanName, passage: cleanPassage, thought: cleanThought, submissionId };
}

export async function saveThought(db: D1Database, input: NonNullable<ReturnType<typeof validateThought>>) {
  const { submissionId, name, passage, thought } = input;
  // A retry after a lost response can recover the original post without creating a duplicate.
  const created = await db.prepare(
    `INSERT INTO scripture_thoughts (submission_id, display_name, passage, thought, created_at)
     VALUES (?, ?, ?, ?, ?) ON CONFLICT(submission_id) DO NOTHING RETURNING ${columns}`
  ).bind(submissionId, name, passage, thought, new Date().toISOString()).first<ThoughtRow>();
  if (created) return { thought: post(created), created: true };
  const prior = await db.prepare(`SELECT ${columns} FROM scripture_thoughts WHERE submission_id = ?`)
    .bind(submissionId).first<ThoughtRow>();
  if (!prior || prior.display_name !== name || prior.passage !== passage || prior.thought !== thought) return null;
  return { thought: post(prior), created: false };
}
