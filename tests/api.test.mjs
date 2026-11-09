import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../api/index.ts';

const origin = 'https://teancum1820.github.io';
function environment(t) {
  const db = new DatabaseSync(':memory:');
  const migrations = new URL('../api/migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(file => file.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  t.after(() => db.close());
  const wrap = (sql, args = []) => ({
    bind: (...values) => wrap(sql, values),
    all: async () => ({results:db.prepare(sql).all(...args)}),
    first: async () => db.prepare(sql).get(...args) ?? null
  });
  return {DB:{prepare:sql => wrap(sql)}, ALLOWED_ORIGINS:origin, THOUGHT_POST_LIMIT:{limit:async () => ({success:true})}};
}
function request(env, body, options = {}) {
  const method = options.method || (body === undefined ? 'GET' : 'PATCH');
  return worker.fetch(new Request('https://example.test' + (options.path || '/progress'), {
    method, headers:{Origin:options.origin || origin, 'Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:typeof body === 'string' ? body : JSON.stringify(body)})
  }), env);
}

test('public reads include all readers and successful edits persist across new requests', async t => {
  const env=environment(t), initial=await (await request(env)).json();
  assert.equal(initial.members.length, 8);
  assert.equal(initial.members.find(member=>member.name==='Daniel').page,0);
  const revision=initial.members.find(member=>member.name==='Mom').revision;
  const saved=await request(env,{name:'Mom',page:42,revision});
  assert.equal(saved.status,200); assert.equal(saved.headers.get('Access-Control-Allow-Origin'),origin);
  const latest=await (await request(env)).json();
  assert.equal(latest.members.find(member=>member.name==='Mom').page,42);
  assert.equal(latest.members.find(member=>member.name==='Mom').revision,revision+1);
  assert.equal(latest.members.find(member=>member.name==='Caleb').page,30);
  assert.equal((await request(env,{name:'Daniel',page:12,revision:0})).status,200);
  const withDaniel=await (await request(env)).json();
  assert.equal(withDaniel.members.find(member=>member.name==='Daniel').page,12);
  assert.equal(withDaniel.members.find(member=>member.name==='Mom').page,42);
});
test('concurrent readers both save; stale edits to the same reader return the latest progress', async t => {
  const env=environment(t);
  const different=await Promise.all([request(env,{name:'Aaron',page:9,revision:0}),request(env,{name:'Lydia',page:25,revision:0})]);
  assert.deepEqual(different.map(response=>response.status),[200,200]);
  const same=await Promise.all([request(env,{name:'Aaron',page:11,revision:1}),request(env,{name:'Aaron',page:12,revision:1})]);
  assert.deepEqual(same.map(response=>response.status).sort(),[200,409]);
  const conflict=await same.find(response=>response.status===409).json();
  assert.equal(conflict.data.members.find(member=>member.name==='Aaron').page,11);
  assert.equal(conflict.data.members.find(member=>member.name==='Lydia').page,25);
});
test('invalid pages, names, revisions, JSON, and oversized bodies never change stored progress', async t => {
  const env=environment(t);
  for (const body of [{name:'Caleb',page:-1,revision:0},{name:'Caleb',page:532,revision:0},{name:'Caleb',page:1.5,revision:0},{name:'Caleb',page:'22',revision:0},{name:'Unknown',page:22,revision:0},{name:'Caleb',page:22},{name:'Caleb',page:22,revision:-1},'not json',null]) {
    assert.equal((await request(env,body)).status,400);
  }
  assert.equal((await request(env,' '.repeat(1025))).status,413);
  const after=await (await request(env)).json();
  assert.equal(after.members.find(member=>member.name==='Caleb').page,30);
});
test('CORS preflight permits the website and rejects other origins and unsupported methods', async t => {
  const env=environment(t);
  assert.equal((await request(env,undefined,{method:'OPTIONS'})).status,204);
  assert.equal((await request(env,{name:'Mom',page:3,revision:0},{origin:'https://other.example'})).status,403);
  assert.equal((await request(env,undefined,{method:'DELETE'})).status,405);
});

const thoughtDraft = (extra = {}) => ({
  name:' Reader ', passage:' 1 Nephi 3:7 ', thought:' The passage made me think.\nWhat is a small step I could take? ', submissionId:crypto.randomUUID(), ...extra
});
const room = (env, body, options = {}) => request(env, body, {
  path:'/thoughts' + (options.query || ''), method:body === undefined ? 'GET' : 'POST', ...options
});

test('a visitor can post a reflection and a second visitor can read it; retries do not duplicate it', async t => {
  const env = environment(t), draft = thoughtDraft();
  const created = await room(env, draft);
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('Access-Control-Allow-Origin'), origin);
  const post = await created.json();
  assert.deepEqual(Object.keys(post).sort(), ['createdAt','id','name','passage','thought']);
  assert.equal(post.name, 'Reader');
  assert.equal(post.passage, '1 Nephi 3:7');
  assert.match(post.thought, /think\.\nWhat/);
  const retried = await room(env, draft);
  assert.equal(retried.status, 200);
  assert.deepEqual(await retried.json(), post);
  assert.equal((await room(env, {...draft, thought:'different content'})).status, 409);
  assert.deepEqual(await (await room(env)).json(), { thoughts:[post], hasMore:false });
  const existing = await (await request(env)).json();
  assert.equal(existing.members.length, 8);
});

test('the latest feed, older pages and incremental refresh return stable, bounded results', async t => {
  const env = environment(t);
  for (let i = 1; i <= 28; i++) assert.equal((await room(env, thoughtDraft({ thought:'Thought ' + i }))).status, 201);
  const latest = await (await room(env)).json();
  assert.equal(latest.thoughts.length, 24);
  assert.equal(latest.thoughts[0].thought, 'Thought 28');
  assert.equal(latest.hasMore, true);
  const older = await (await room(env, undefined, { query:'?before=' + latest.thoughts.at(-1).id })).json();
  assert.deepEqual(older.thoughts.map(item => item.thought), ['Thought 4', 'Thought 3', 'Thought 2', 'Thought 1']);
  assert.equal(older.hasMore, false);
  const fresh = await room(env, thoughtDraft({ passage:'Luke 2:10–11', thought:'A new reflection' }));
  const freshPost = await fresh.json();
  const update = await (await room(env, undefined, { query:'?after=' + latest.thoughts[0].id })).json();
  assert.deepEqual(update, { thoughts:[freshPost], hasMore:false });
  assert.equal((await room(env, undefined, { query:'?before=garbage' })).status, 400);
});

test('the room rejects invalid writes and cross-origin posts, and handles the posting limit', async t => {
  const env = environment(t);
  for (const extra of [{name:' '}, {name:'x'.repeat(33)}, {passage:''}, {passage:'x'.repeat(81)}, {thought:'x'.repeat(1001)}, {submissionId:'bad'}]) {
    assert.equal((await room(env, thoughtDraft(extra))).status, 400);
  }
  assert.equal((await room(env, ' '.repeat(8193))).status, 413);
  assert.equal((await room(env, thoughtDraft(), { origin:'https://other.example' })).status, 403);
  const preflight = await room(env, undefined, { method:'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  env.THOUGHT_POST_LIMIT.limit = async () => ({ success:false });
  const limited = await room(env, thoughtDraft());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  assert.deepEqual(await (await room(env)).json(), { thoughts:[], hasMore:false });
});
