import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pace, dateInZone, dateNumber, ranked, validateData, validateChapters, chapterProgress } from '../dist/core.mjs';
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
test('ties preserve actual progress and the farthest reader ranks first', () => {
  assert.deepEqual(ranked([{ name:'A',page:20 },{ name:'B',page:20 },{ name:'C',page:5 },{ name:'D',page:0 }]).map(m => m.rank), [1,1,3,null]);
  assert.deepEqual(ranked([{name:'A',page:3},{name:'B',page:120},{name:'C',page:30}]).map(m => m.name), ['B','C','A']);
});
test('the researched map covers 15 books and all 239 chapters, including shared pages', async () => {
  const guide = validateChapters(JSON.parse(await readFile(new URL('../dist/chapters.json', import.meta.url))));
  const progress = chapterProgress(guide.books, 30);
  assert.equal(progress.chapters.length, 239); assert.equal(progress.completed, 14);
  assert.equal(progress.current.id, '1-ne-15');
  assert.deepEqual(guide.books[0].chapters[0], { number:1, startPage:1, endPage:3 });
  assert.equal(guide.books[0].endPage, 53); assert.equal(guide.books[1].startPage, 53);
  assert.equal(chapterProgress(guide.books, 0).completed, 0);
  assert.equal(chapterProgress(guide.books, 0).current.id, '1-ne-1');
  assert.equal(chapterProgress(guide.books, 531).completed, 239);
  assert.equal(chapterProgress(guide.books, 531).current, null);
  assert.equal(chapterProgress(guide.books, 519).current.id, 'moro-6');
  const broken = structuredClone(guide); broken.books[8].chapters.pop(); assert.throws(() => validateChapters(broken));
  const badPage = structuredClone(guide); badPage.books[0].chapters[0].endPage = 0; assert.throws(() => validateChapters(badPage));
});
test('each family member has a separate static journey page', async () => {
  const data = JSON.parse(await readFile(new URL('../dist/progress.json', import.meta.url)));
  for (const member of data.members) {
    const html = await readFile(new URL(`../dist/journeys/${member.name.toLowerCase()}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(`data-member="${member.name}"`));
    assert.ok(html.includes('src="../../journey.mjs"'));
  }
});
