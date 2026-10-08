export const STANDARD_PAGES = 531;
export const BOOKS = [
  ['1 Nephi', '1 Ne.', 1], ['2 Nephi', '2 Ne.', 53], ['Jacob', 'Jac.', 117],
  ['Enos', 'Enos', 136], ['Jarom', 'Jar.', 138], ['Omni', 'Omni', 140],
  ['Words of Mormon', 'W of M', 143], ['Mosiah', 'Mos.', 145], ['Alma', 'Alma', 207],
  ['Helaman', 'Hel.', 368], ['3 Nephi', '3 Ne.', 406], ['4 Nephi', '4 Ne.', 465],
  ['Mormon', 'Morm.', 469], ['Ether', 'Eth.', 487], ['Moroni', 'Moro.', 518]
].map(([name, short, start], i, rows) => ({ name, short, start, end: (rows[i + 1]?.[2] ?? 532) - 1 }));

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
  const expected = ['Caleb', 'Caitlin', 'Elizabeth', 'Benjamin', 'Aaron', 'Lydia'];
  if (new Set(data.members.map(m => m.name)).size !== 6) throw new Error('Each reader must appear once.');
  for (const member of data.members) {
    if (!expected.includes(member.name) || !Number.isInteger(member.page) || member.page < 0 || member.page > data.challenge.totalPages) throw new Error('Each reader needs a valid completed page number.');
    if (member.avatar != null && (typeof member.avatar !== 'string' || /^(?!https:\/\/)[a-z][a-z\d+.-]*:/i.test(member.avatar) || member.avatar.startsWith('//'))) throw new Error('Photos must use a relative file path or an HTTPS URL.');
  }
  if (data.updatedAt != null && !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('The update time is invalid.');
  return data;
}

export function bookAt(page) {
  if (page <= 0) return 'Ready to begin';
  if (page >= 531) return 'Moroni 10 · Finished!';
  return BOOKS.find(b => page >= b.start && page <= b.end)?.name ?? 'Reading';
}

export function position(page, totalPages, view) {
  if (view === 'pages' || totalPages !== STANDARD_PAGES) return page / totalPages * 100;
  if (page <= 0) return 0;
  if (page >= STANDARD_PAGES) return 100;
  const i = BOOKS.findIndex(b => page <= b.end);
  const b = BOOKS[i];
  return (i + (page - b.start + 1) / (b.end - b.start + 1)) / BOOKS.length * 100;
}

export function ranked(members) {
  const sorted = [...members].sort((a, b) => b.page - a.page);
  return sorted.map((m, i) => ({ ...m, rank: m.page === 0 ? null : sorted.findIndex(other => other.page === m.page) + 1 }));
}
