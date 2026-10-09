import seed from '../dist/progress.json' with { type: 'json' };

type ReaderRow = { name: string; page: number; revision: number; updated_at: string };
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'Send the page update as JSON.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Choose a reader and page.');
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); throw new ApiError(413, 'This page update is too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); }
  catch { throw new ApiError(400, 'The page update could not be read.'); }
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
    const origin = request.headers.get('Origin');
    const allowed = origin !== null && env.ALLOWED_ORIGINS.split(',').includes(origin);
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (allowed) headers.set('Access-Control-Allow-Origin', origin);
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    try {
      if (new URL(request.url).pathname !== '/progress') return json({ error: 'Not found.' }, 404);
      if (request.method === 'OPTIONS') {
        if (!allowed) return json({ error: 'Open the family challenge website to update progress.' }, 403);
        headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        headers.set('Access-Control-Max-Age', '86400');
        return new Response(null, { status: 204, headers });
      }
      if (request.method === 'GET') return json(await progress(env));
      if (request.method !== 'PATCH') { headers.set('Allow', 'GET, PATCH, OPTIONS'); return json({ error: 'Method not allowed.' }, 405); }
      if (!allowed) return json({ error: 'Open the family challenge website to update progress.' }, 403);
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
      console.error(JSON.stringify({ event: 'progress-api-error', message: error instanceof Error ? error.message : 'Unknown error' }));
      return json({ error: 'Progress could not be saved or loaded. Please try again.' }, 503);
    }
  }
} satisfies ExportedHandler<Env>;
