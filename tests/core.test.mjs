import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pace, dateInZone, dateNumber, position, ranked, validateData, BOOKS } from '../dist/core.mjs';
const plan = { startDate: '2026-10-06', endDate: '2026-12-25', totalPages: 531 };
test('81 inclusive reading days, rounded-up daily targets, exact finish', () => {
  const day3 = pace(plan, '2026-10-08');
  assert.equal(day3.totalDays, 81); assert.equal(day3.pagesPerDay, 531 / 81);
  assert.equal(day3.target, 20); assert.equal(day3.yesterdayTarget, 14); assert.equal(day3.remainingDays, 78);
  assert.equal(pace(plan, '2026-10-06').target, 7);
  assert.equal(pace(plan, '2026-12-25').target, 531);
  assert.equal(pace(plan, '2026-12-25').remainingDays, 0);
  assert.equal(pace(plan, '2026-10-05').target, 0);
  assert.equal(pace(plan, '2026-12-26').state, 'finished');
});
test('calendar math handles leap years, DST, and same-day plans', () => {
  assert.equal(pace({ startDate:'2028-02-28', endDate:'2028-03-01', totalPages:9 }, '2028-02-29').totalDays, 3);
  assert.equal(pace({ startDate:'2026-10-31', endDate:'2026-11-02', totalPages:9 }, '2026-11-01').target, 6);
  assert.equal(pace({ ...plan, endDate:plan.startDate }, plan.startDate).target, 531);
  assert.equal(dateInZone('America/Denver', new Date('2026-10-09T05:59:00Z')), '2026-10-08');
  assert.equal(dateInZone('America/Denver', new Date('2026-10-09T06:00:00Z')), '2026-10-09');
});
test('bad dates, backwards plans, fractions and zero counts are rejected', () => {
  assert.throws(() => dateNumber('2026-02-30'));
  assert.throws(() => pace({ ...plan, endDate:'2026-10-05' }, plan.startDate));
  for (const totalPages of [0, -1, 1.5, NaN, 100001]) assert.throws(() => pace({ ...plan, totalPages }, plan.startDate));
});
test('shared data is valid and rejects unsafe data', async () => {
  const data = JSON.parse(await readFile(new URL('../dist/progress.json', import.meta.url)));
  assert.equal(validateData(data).members.length, 6);
  for (const page of [-1, data.challenge.totalPages + 1, 0.5]) { const bad = structuredClone(data); bad.members[0].page = page; assert.throws(() => validateData(bad)); }
  const badPhoto = structuredClone(data); badPhoto.members[0].avatar = 'javascript:alert(1)'; assert.throws(() => validateData(badPhoto));
  const duplicates = structuredClone(data); duplicates.members[1].name = 'Caleb'; assert.throws(() => validateData(duplicates));
});
test('book boundaries and ties preserve actual progress', () => {
  assert.equal(BOOKS.length, 15); assert.equal(BOOKS.at(-1).end, 531);
  assert.equal(position(531, 531, 'books'), 100); assert.equal(position(0, 531, 'books'), 0);
  for (let page = 1; page <= 531; page++) assert.ok(position(page, 531, 'books') >= position(page - 1, 531, 'books'));
  assert.deepEqual(ranked([{ name:'A',page:20 },{ name:'B',page:20 },{ name:'C',page:5 },{ name:'D',page:0 }]).map(m => m.rank), [1,1,3,null]);
});
