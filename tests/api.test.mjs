import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../api/index.ts';

const origin = 'https://teancum1820.github.io';
function environment(t) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../api/migrations/0001_readers.sql', import.meta.url), 'utf8'));
  t.after(() => db.close());
  const wrap = (sql, args = []) => ({
    bind: (...values) => wrap(sql, values),
    all: async () => ({results:db.prepare(sql).all(...args)}),
    first: async () => db.prepare(sql).get(...args) ?? null
  });
  return {DB:{prepare:sql => wrap(sql)}, ALLOWED_ORIGINS:origin};
}
function request(env, body, options = {}) {
  const method = options.method || (body === undefined ? 'GET' : 'PATCH');
  return worker.fetch(new Request('https://example.test/progress', {
    method, headers:{Origin:options.origin || origin, 'Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:typeof body === 'string' ? body : JSON.stringify(body)})
  }), env);
}

test('public reads include all readers and successful edits persist across new requests', async t => {
  const env=environment(t), initial=await (await request(env)).json();
  assert.equal(initial.members.length, 7);
  const revision=initial.members.find(member=>member.name==='Mom').revision;
  const saved=await request(env,{name:'Mom',page:42,revision});
  assert.equal(saved.status,200); assert.equal(saved.headers.get('Access-Control-Allow-Origin'),origin);
  const latest=await (await request(env)).json();
  assert.equal(latest.members.find(member=>member.name==='Mom').page,42);
  assert.equal(latest.members.find(member=>member.name==='Mom').revision,revision+1);
  assert.equal(latest.members.find(member=>member.name==='Caleb').page,30);
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
