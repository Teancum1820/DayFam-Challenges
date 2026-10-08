export const STANDARD_PAGES = 531;
const BOOK_NAMES = ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni',
  'Words of Mormon', 'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi',
  'Mormon', 'Ether', 'Moroni'];

export function dateNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose valid dates.');
  const n = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== value) throw new Error('Choose valid dates.');
  return n / 86400000;
}

export function dateInZone(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function pace({ startDate, endDate, totalPages }, today) {
  const start = dateNumber(startDate), end = dateNumber(endDate), day = dateNumber(today);
  if (end < start) throw new Error('The finish date must be on or after the start date.');
  if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > 100000) throw new Error('Enter a whole page count from 1 to 100,000.');
  const totalDays = end - start + 1;
  const elapsedDays = Math.max(0, Math.min(totalDays, day - start + 1));
  return {
    totalDays, elapsedDays, remainingDays: Math.max(0, end - Math.max(day, start - 1)),
    pagesPerDay: totalPages / totalDays,
    target: Math.ceil(totalPages * elapsedDays / totalDays),
    yesterdayTarget: Math.ceil(totalPages * Math.max(0, elapsedDays - 1) / totalDays),
    state: day < start ? 'upcoming' : day > end ? 'finished' : 'active'
  };
}

export function validateData(data) {
  if (!data?.challenge || !Array.isArray(data.members) || data.members.length !== 6) throw new Error('The shared progress file needs the challenge and all six readers.');
  pace(data.challenge, data.challenge.startDate);
  dateInZone(data.challenge.timeZone);
  const expected = ['Caleb', 'Katelyn', 'Elizabeth', 'Benjamin', 'Aaron', 'Lydia'];
  if (new Set(data.members.map(m => m.name)).size !== 6) throw new Error('Each reader must appear once.');
  for (const member of data.members) {
    if (!expected.includes(member.name) || !Number.isInteger(member.page) || member.page < 0 || member.page > data.challenge.totalPages) throw new Error('Each reader needs a valid completed page number.');
    if (member.avatar != null && (typeof member.avatar !== 'string' || /^(?!https:\/\/)[a-z][a-z\d+.-]*:/i.test(member.avatar) || member.avatar.startsWith('//'))) throw new Error('Photos must use a relative file path or an HTTPS URL.');
  }
  if (data.updatedAt != null && !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('The update time is invalid.');
  return data;
}

export function ranked(members) {
  const sorted = [...members].sort((a, b) => b.page - a.page);
  return sorted.map((m, i) => ({ ...m, rank: m.page === 0 ? null : sorted.findIndex(other => other.page === m.page) + 1 }));
}

export function validateChapters(data) {
  const expected = [22, 33, 7, 1, 1, 1, 1, 29, 63, 16, 30, 1, 9, 15, 10];
  if (data?.books?.length !== 15) throw new Error('The reading map needs all 15 books.');
  let previousStart = 0;
  data.books.forEach((book, i) => {
    if (book.name !== BOOK_NAMES[i] || book.chapters?.length !== expected[i] || !/^[a-z0-9-]+$/.test(book.slug)) throw new Error('The chapter map is incomplete.');
    book.chapters.forEach((chapter, j) => {
      if (chapter.number !== j + 1 || !Number.isInteger(chapter.startPage) || !Number.isInteger(chapter.endPage) || chapter.startPage < previousStart || chapter.startPage < 1 || chapter.endPage < chapter.startPage || chapter.endPage > STANDARD_PAGES) throw new Error('The chapter page references are invalid.');
      previousStart = chapter.startPage;
    });
  });
  if (data.books[0].chapters[0].startPage !== 1 || data.books.at(-1).chapters.at(-1).endPage !== STANDARD_PAGES) throw new Error('The map must run from page 1 to page 531.');
  return data;
}

export function chapterProgress(books, page) {
  const chapters = books.flatMap((book, bookIndex) => book.chapters.map(chapter => ({ ...chapter, book: book.name, slug: book.slug, bookIndex, id: `${book.slug}-${chapter.number}` })));
  return { chapters, completed: chapters.filter(chapter => page >= chapter.endPage).length, current: chapters.find(chapter => chapter.endPage > page) ?? null };
}
