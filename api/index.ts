import seed from '../dist/progress.json' with { type: 'json' };
import { listThoughts, saveThought, validateThought } from './thoughts.ts';

type ReaderRow = { name: string; page: number; revision: number; updated_at: string };
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function readBody(request: Request, maxBytes = 1024, label = 'page update'): Promise<unknown> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiError(415, `Send the ${label} as JSON.`);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, `The ${label} is missing.`);
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, `This ${label} is too large.`); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); }
  catch { throw new ApiError(400, `The ${label} could not be read.`); }
}

async function progress(env: Env) {
  const { results } = await env.DB.prepare('SELECT name, page, revision, updated_at FROM readers').all<ReaderRow>();
  const rows = new Map(results.map(row => [row.name, row]));
  const members = seed.members.map(member => {
    const row = rows.get(member.name);
    if (!row) throw new ApiError(503, 'Shared progress is being set up. Please try again shortly.');
    return { ...member, page: row.page, revision: row.revision };
  });
  return { challenge: seed.challenge, members, updatedAt: results.map(row => row.updated_at).sort().at(-1) };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const isRoom = url.pathname === '/thoughts';
    const origin = request.headers.get('Origin');
    const allowed = origin !== null && env.ALLOWED_ORIGINS.split(',').includes(origin);
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (allowed) headers.set('Access-Control-Allow-Origin', origin);
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    try {
      if (!isRoom && url.pathname !== '/progress') return json({ error: 'Not found.' }, 404);
      const methods = isRoom ? 'GET, POST, OPTIONS' : 'GET, PATCH, OPTIONS';
      const originError = isRoom ? 'Open the Scripture Thought Chat Room to post.' : 'Open the family challenge website to update progress.';
      if (request.method === 'OPTIONS') {
        if (!allowed) return json({ error: originError }, 403);
        headers.set('Access-Control-Allow-Methods', methods);
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        headers.set('Access-Control-Max-Age', '86400');
        return new Response(null, { status: 204, headers });
      }
      if (isRoom) {
        if (request.method === 'GET') {
          const feed = await listThoughts(env.DB, url.searchParams);
          return feed ? json(feed) : json({ error: 'Invalid conversation cursor.' }, 400);
        }
        if (request.method !== 'POST') { headers.set('Allow', methods); return json({ error: 'Method not allowed.' }, 405); }
        if (!allowed) return json({ error: originError }, 403);
        const input = validateThought(await readBody(request, 8192, 'scripture thought'));
        if (!input) return json({ error: 'Enter a display name (1–32 characters), a scripture reference (1–80), and a thought (1–1,000).' }, 400);
        const key = request.headers.get('CF-Connecting-IP') ?? 'local';
        if (!(await env.THOUGHT_POST_LIMIT.limit({ key })).success) {
          headers.set('Retry-After', '60');
          return json({ error: 'Give it a minute before posting another thought.' }, 429);
        }
        const saved = await saveThought(env.DB, input);
        if (!saved) return json({ error: 'This draft conflicts with an earlier submission. Edit it before trying again.' }, 409);
        return json(saved.thought, saved.created ? 201 : 200);
      }
      if (request.method === 'GET') return json(await progress(env));
      if (request.method !== 'PATCH') { headers.set('Allow', 'GET, PATCH, OPTIONS'); return json({ error: 'Method not allowed.' }, 405); }
      if (!allowed) return json({ error: originError }, 403);
      const input = await readBody(request);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApiError(400, 'Choose a reader and page.');
      const { name, page, revision } = input as Record<string, unknown>;
      if (typeof name !== 'string' || !seed.members.some(member => member.name === name)) throw new ApiError(400, 'Choose a family reader.');
      if (typeof page !== 'number' || !Number.isInteger(page) || page < 0 || page > seed.challenge.totalPages) throw new ApiError(400, 'Enter a whole page number from 0 to 531.');
      if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) throw new ApiError(400, 'Refresh the reader’s progress before saving.');
      // The revision condition makes same-reader edits atomic. Separate readers never overwrite one another.
      const updated = await env.DB.prepare('UPDATE readers SET page = ?, revision = revision + 1, updated_at = ? WHERE name = ? AND revision = ? RETURNING name')
        .bind(page, new Date().toISOString(), name, revision).first<{ name: string }>();
      if (!updated) return json({ error: 'Someone updated this reader while you were editing. Review the latest page and save again.', data: await progress(env) }, 409);
      return json(await progress(env));
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ event: isRoom ? 'thought-room-api-error' : 'progress-api-error', message: error instanceof Error ? error.message : 'Unknown error' }));
      return json({ error: isRoom ? 'The room is temporarily unavailable. Please try again.' : 'Progress could not be saved or loaded. Please try again.' }, 503);
    }
  }
} satisfies ExportedHandler<Env>;
