import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { REGIONS, WORLDS, LANDMARKS, regionAt, storyAsset } from '../dist/story.mjs';
import { chapterConnections } from '../dist/path.mjs';
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
    assert.ok(html.includes('src="../../journey.mjs?v='));
  }
});

test('every chapter has exactly one illustrated setting and every landmark asset exists', async () => {
  const guide = JSON.parse(await readFile(new URL('../dist/chapters.json', import.meta.url)));
  const ids = new Set();
  for (const book of guide.books) {
    for (const chapter of book.chapters) {
      ids.add(`${book.slug}-${chapter.number}`);
      assert.equal(REGIONS[book.slug].filter(([a,b]) => chapter.number >= a && chapter.number <= b).length, 1);
      assert.ok(regionAt(book.slug, chapter.number));
    }
  }
  for (const [id, landmark] of Object.entries(LANDMARKS)) {
    assert.ok(ids.has(id), `Unknown landmark chapter ${id}`);
    await access(new URL('../dist/' + storyAsset(landmark.asset), import.meta.url));
  }
  for (const world of Object.values(WORLDS)) await access(new URL('../dist/' + storyAsset(world.image), import.meta.url));
  assert.equal(LANDMARKS['1-ne-1'].asset, 'book-of-mormon');
  assert.equal(LANDMARKS['1-ne-4'].asset, 'brass-plates');
  assert.equal(LANDMARKS['1-ne-8'].asset, 'tree-of-life');
  assert.equal(LANDMARKS['moro-10'].asset, 'gold-plates');
  assert.equal(regionAt('1-ne', 18).world, 'ocean');
  assert.equal(regionAt('3-ne', 8).world, 'destruction');
  assert.equal(regionAt('3-ne', 11).world, 'temple');
});

test('all eight pages share the simplified header and two-color instructions', async () => {
  for (const route of ['', 'maps/', ...['caleb','katelyn','elizabeth','benjamin','aaron','lydia'].map(n => 'journeys/' + n + '/')]) {
    const html = await readFile(new URL(`../dist/${route}index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes('Book of Mormon<br class="title-break"> Christmas Challenge'));
    assert.ok(html.includes('id="instructions"') && html.includes('<h3>Deity</h3>') && html.includes('The gospel of Jesus Christ'));
    assert.ok(html.includes('COLOR 1 · RED') && !html.includes('COLOR 1 · GOLD'));
    for (const removed of ['edit-progress','READ A LITTLE','The family reading race','Every page counts','DayFam Challenges home']) assert.ok(!html.includes(removed));
  }
});

test('one continuous path connects all chapters across scenery and book boundaries at either width', async () => {
  const guide = JSON.parse(await readFile(new URL('../dist/chapters.json', import.meta.url)));
  const chapters = guide.books.flatMap(book => book.chapters.map(chapter => ({...chapter, book:book.slug, id:`${book.slug}-${chapter.number}`})));
  for (const width of [358, 912]) {
    const points = chapters.map((chapter, i) => ({...chapter, x:width/2+(i%3-1)*width*.1, y:100+i*180, entryY:80+i*180, exitY:140+i*180}));
    const connections = chapterConnections(points, width);
    assert.equal(connections.length, 238);
    assert.equal(connections.filter(segment => segment.bookBreak).length, 14);
    connections.forEach((segment, i) => {
      assert.equal(segment.from.id, points[i].id);
      assert.equal(segment.to.id, points[i+1].id);
      assert.ok(segment.d.startsWith(`M ${points[i].x} ${points[i].y} `));
      assert.ok(segment.d.endsWith(`${points[i+1].x} ${points[i+1].y}`));
      if (segment.bookBreak) assert.ok(segment.d.includes(`L ${width-10} ${points[i+1].entryY}`));
      segment.pages.forEach(page => assert.ok(page > segment.from.startPage && page < segment.to.startPage));
    });
    for (const [from,to] of [['1-ne-17','1-ne-18'],['1-ne-18','1-ne-19'],['1-ne-22','2-ne-1']]) {
      assert.ok(connections.some(segment => segment.from.id===from && segment.to.id===to));
    }
    const pageDots = connections.flatMap(segment => segment.pages);
    assert.equal(new Set(pageDots).size, pageDots.length, 'Shared printed pages must not create duplicate dots');
  }
  assert.deepEqual(chapterConnections([], 358), []);
  assert.deepEqual(chapterConnections([{x:100,y:100}], 358), []);
});
