import { BOOKS, STANDARD_PAGES, pace, dateInZone, bookAt, position, ranked, validateData } from './core.mjs';

const $ = id => document.getElementById(id);
const COLORS = {
  Caleb: ['#8a6ca9', '#eae1f3'], Caitlin: ['#ce8e6f', '#f7e4d7'],
  Elizabeth: ['#c77998', '#f7e2ec'], Benjamin: ['#6b9d87', '#e0eee7'],
  Aaron: ['#b99a4b', '#f7eed1'], Lydia: ['#779ab9', '#e1edf7']
};
const ICONS = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1Zm0 0v16"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flag: '<path d="M5 21V3c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.icon]}</svg>`;
});

let shared, current, view = 'pages', mode = 'shared', draft;
let lastToday = '', toastTimer;
const setText = (id, text) => { $(id).textContent = text; };
const shortDate = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
function showToast(message) {
  setText('toast', message); $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}
function showError(message) { setText('data-error', message); $('data-error').hidden = false; }
function getToday() { return dateInZone(current.challenge.timeZone); }

function render() {
  const { challenge, members } = current;
  const today = getToday(), plan = pace(challenge, today);
  lastToday = today;
  setText('challenge-dates', `${shortDate(challenge.startDate)} — ${shortDate(challenge.endDate)}, ${challenge.endDate.slice(0, 4)}`);
  setText('challenge-status', plan.state === 'active' ? 'Challenge in progress' : plan.state === 'upcoming' ? 'The adventure starts soon' : 'Christmas challenge complete');
  setText('today-target', plan.target);
  setText('today-book', challenge.totalPages === STANDARD_PAGES && plan.target > 0 ? bookAt(plan.target).replace(' · Finished!', '') : '');
  setText('today-date', shortDate(today));
  setText('today-description', plan.state === 'upcoming' ? `Start with page 1 on ${shortDate(challenge.startDate)}` : plan.state === 'finished' ? 'The challenge has ended. Keep your reading habit going.' : plan.target === plan.yesterdayTarget ? `No new pages due today. Stay at page ${plan.target}.` : `Read pages ${plan.yesterdayTarget + 1}–${plan.target} today to stay on pace`);
  setText('daily-pace', plan.pagesPerDay.toFixed(2));
  setText('pace-description', `${challenge.totalPages} pages · ${plan.totalDays} days · one meaningful habit`);
  setText('days-left', plan.remainingDays);
  setText('finish-description', plan.state === 'upcoming' ? `${plan.totalDays} reading days, starting ${shortDate(challenge.startDate)}` : plan.state === 'finished' ? 'The finish line is here. Every page still counts.' : `Finish ${shortDate(challenge.endDate)} · ${plan.remainingDays} days after today`);
  setText('countdown-label', plan.state === 'finished' ? 'THE FINISH LINE' : 'UNTIL THE FINISH');
  setText('family-pages', members.reduce((sum, m) => sum + m.page, 0).toLocaleString());
  setText('journey-caption', view === 'books' ? 'Large bubbles: book finishes · Small bubbles: 10-page checkpoints' : `1 Nephi 1 → Moroni 10 · ${challenge.totalPages} pages · Dots every 10 pages`);
  if (challenge.totalPages !== STANDARD_PAGES) setText('journey-caption', `${challenge.totalPages} pages · Dots every ${Math.max(10, Math.ceil(challenge.totalPages / 60 / 10) * 10)} pages`);
  setText('updated-label', mode === 'demo' ? 'Example progress · not the family’s actual pages' : mode === 'preview' ? 'Local preview · shared progress has not changed' : current.updatedAt ? `Updated ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: challenge.timeZone }).format(new Date(current.updatedAt))}` : 'No progress recorded yet · everyone starts at page 0');
  $('preview-notice').hidden = mode === 'shared';
  setText('preview-message', mode === 'demo' ? 'Demo mode — these are example page counts so you can try the leaderboard.' : 'Update preview — visible only in this tab. Publish the progress file to share these changes.');
  setText('demo-button', mode === 'demo' ? 'Exit demo ↗' : 'Try a demo ↗');
  $('edit-progress').disabled = mode === 'demo';
  $('view-books').disabled = challenge.totalPages !== STANDARD_PAGES;
  $('view-books').title = challenge.totalPages !== STANDARD_PAGES ? 'Book milestones use the standard 531-page English edition.' : 'View book milestones';
  $('view-pages').setAttribute('aria-pressed', view === 'pages');
  $('view-books').setAttribute('aria-pressed', view === 'books');
  renderAxis(plan, challenge);
  const rows = $('reader-rows'); rows.replaceChildren();
  ranked(members).forEach((member, index) => {
    const [color, light] = COLORS[member.name];
    const percentage = member.page / challenge.totalPages * 100;
    const row = document.createElement('div'); row.className = 'reader-row';
    row.style.cssText = `--color:${color};--light:${light};--progress:${position(member.page, challenge.totalPages, view)}%;--target:${position(plan.target, challenge.totalPages, view)}%;--index:${index}`;
    let status = member.page === challenge.totalPages ? 'The whole story. Well done! ✦' : member.page === 0 ? 'Your adventure awaits' : member.page >= plan.target ? `${member.page - plan.target ? `${member.page - plan.target} pages ahead` : 'Right on track'} ✦` : `${plan.target - member.page} pages to today’s target`;
    const statusClass = member.page === challenge.totalPages ? 'finished' : member.page > 0 && member.page >= plan.target ? 'on-track' : '';
    row.innerHTML = `<div class="reader-info"><span class="rank ${member.rank === 1 ? 'leading' : ''}" aria-label="${member.rank ? `Rank ${member.rank}` : 'Not started'}">${member.rank ?? '—'}</span><span class="avatar">${member.name[0]}</span><div><div class="reader-name">${member.name}</div><div class="reader-book">${challenge.totalPages === STANDARD_PAGES ? bookAt(member.page) : member.page ? 'Reading' : 'Ready to begin'}</div></div></div><div class="track" role="img" aria-label="${member.name} has read ${member.page} of ${challenge.totalPages} pages, ${percentage.toFixed(1)} percent. Today’s target is page ${plan.target}."><span class="track-fill"></span><span class="target-line"></span></div><div class="reader-stats">${member.page} <small>/ ${challenge.totalPages}</small><span class="reader-status ${statusClass}">${status}</span></div>`;
    if (member.avatar) {
      const img = document.createElement('img'); img.src = member.avatar; img.alt = ''; img.loading = 'lazy';
      img.addEventListener('error', () => { img.remove(); row.querySelector('.avatar').textContent = member.name[0]; }, { once: true });
      row.querySelector('.avatar').replaceChildren(img);
    }
    const track = row.querySelector('.track');
    const step = Math.max(10, Math.ceil(challenge.totalPages / 60 / 10) * 10);
    for (let page = step; page < challenge.totalPages; page += step) addTick(track, page, page % (step * 10) === 0 && view === 'pages', `Page ${page}`);
    if (view === 'books' && challenge.totalPages === STANDARD_PAGES) BOOKS.forEach(book => addTick(track, book.end, true, `${book.name} finished · page ${book.end}`));
    if (view === 'pages') addTick(track, challenge.totalPages, true, 'Moroni 10 · finish line', true);
    else track.querySelector('.tick:last-child')?.classList.add('finish-tick');
    const cursor = document.createElement('span'); cursor.className = 'track-cursor'; cursor.title = `Page ${member.page}`; cursor.setAttribute('aria-hidden', 'true'); track.append(cursor);
    rows.append(row);
  });
  $('leaderboard').setAttribute('aria-busy', 'false');
}

function addTick(track, page, big, title, finish = false) {
  const tick = document.createElement('span');
  tick.className = `tick${big ? ' book-tick' : ''}${page <= Number(track.closest('.reader-row').querySelector('.reader-stats').firstChild.textContent) ? ' read' : ''}${finish ? ' finish-tick' : ''}`;
  tick.style.setProperty('--at', `${position(page, current.challenge.totalPages, view)}%`);
  tick.title = title; tick.setAttribute('aria-hidden', 'true'); if (finish) tick.textContent = '✦'; track.append(tick);
}

function renderAxis(plan, challenge) {
  const axis = $('chart-axis'); axis.replaceChildren();
  const labels = view === 'books' ? BOOKS.map(b => [position(b.end, challenge.totalPages, view), b.short]) : [0, 100, 200, 300, 400, 531].filter(n => n <= challenge.totalPages).map(n => [n / challenge.totalPages * 100, n === 0 ? 'START' : n === challenge.totalPages ? 'FINISH' : String(n)]);
  if (view === 'pages' && challenge.totalPages !== STANDARD_PAGES) labels.push([100, 'FINISH']);
  labels.forEach(([left, label]) => { const el = document.createElement('span'); el.className = `axis-label ${view === 'books' ? 'axis-book' : ''}`; el.textContent = label; el.style.left = `${left}%`; axis.append(el); });
  if (plan.state === 'active') { const today = document.createElement('span'); today.className = 'axis-label today-label'; today.textContent = `TODAY · ${plan.target}`; today.style.left = `${Math.min(90, position(plan.target, challenge.totalPages, view))}%`; axis.append(today); }
}

function renderCalculator() {
  try {
    const plan = pace({ startDate: $('calc-start').value, endDate: $('calc-end').value, totalPages: Number($('calc-pages').value) }, shared ? dateInZone(shared.challenge.timeZone) : dateInZone('America/Denver'));
    setText('calc-rate', plan.pagesPerDay.toFixed(2)); setText('calc-days', `${plan.totalDays} reading ${plan.totalDays === 1 ? 'day' : 'days'}`);
    setText('calc-target', plan.state === 'upcoming' ? `Your first reading day is ${shortDate($('calc-start').value)}.` : plan.state === 'finished' ? `This plan ended ${shortDate($('calc-end').value)}. Choose a future finish date to plan your next read.` : `By the end of today, aim for page ${plan.target}. That’s ${Math.ceil(plan.pagesPerDay)} pages on most days.`);
    $('calc-error').hidden = true; return true;
  } catch (error) { setText('calc-error', error.message); $('calc-error').hidden = false; setText('calc-rate', '—'); setText('calc-days', 'Check your plan'); setText('calc-target', ''); return false; }
}
$('pace-form').addEventListener('submit', event => { event.preventDefault(); if (renderCalculator()) showToast('Your reading rhythm is ready.'); });
['calc-start', 'calc-end', 'calc-pages'].forEach(id => $(id).addEventListener('change', renderCalculator));
$('view-pages').addEventListener('click', () => { if (!current) return; view = 'pages'; render(); });
$('view-books').addEventListener('click', () => { if (!current) return; view = 'books'; render(); });
$('demo-button').addEventListener('click', () => {
  if (!shared) return;
  if (mode === 'demo') { mode = 'shared'; current = structuredClone(shared); }
  else { mode = 'demo'; current = structuredClone(shared); [427, 386, 342, 271, 218, 164].forEach((page, i) => { current.members[i].page = Math.min(page, current.challenge.totalPages); }); }
  render();
});
$('reset-preview').addEventListener('click', () => { mode = 'shared'; current = structuredClone(shared); draft = null; render(); });
$('edit-progress').addEventListener('click', () => {
  if (!shared || mode === 'demo') return;
  const fields = $('editor-fields'); fields.replaceChildren();
  current.members.forEach(member => {
    const [color, light] = COLORS[member.name];
    const label = document.createElement('label');
    label.innerHTML = `<span class="avatar" style="--color:${color};--light:${light}" aria-hidden="true">${member.name[0]}</span><span>${member.name}</span><input type="number" name="${member.name}" min="0" max="${current.challenge.totalPages}" step="1" value="${member.page}" required aria-label="Last completed page for ${member.name}">`;
    fields.append(label);
  });
  $('publish-help').hidden = true; $('editor-error').hidden = true; setText('copy-status', ''); $('editor').showModal();
});
$('close-editor').addEventListener('click', () => $('editor').close());
$('editor').addEventListener('click', event => { if (event.target === $('editor')) { const bounds = $('editor').getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('editor').close(); } });
$('progress-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    draft = structuredClone(current); const fields = new FormData(event.target);
    draft.members.forEach(member => { member.page = Number(fields.get(member.name)); });
    draft.updatedAt = new Date().toISOString(); validateData(draft);
    mode = 'preview'; current = structuredClone(draft); render();
    $('publish-help').hidden = false; $('editor-error').hidden = true; showToast('Preview ready. Publish the file to share it.');
  } catch (error) { setText('editor-error', error.message); $('editor-error').hidden = false; }
});
$('copy-json').addEventListener('click', async () => {
  if (!draft) return;
  try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2) + '\n'); setText('copy-status', 'Copied! Paste this over the entire progress.json file on GitHub.'); }
  catch { setText('copy-status', 'Copy is unavailable in this browser. Download the file instead.'); }
});
$('download-json').addEventListener('click', () => {
  if (!draft) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'progress.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  setText('copy-status', 'Downloaded. Replace dist/progress.json in the repository with this file.');
});

async function loadProgress(initial = false) {
  try {
    const response = await fetch('./progress.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Progress file returned ${response.status}.`);
    const data = validateData(await response.json());
    const changed = JSON.stringify(shared) !== JSON.stringify(data);
    shared = data; $('data-error').hidden = true;
    if (mode === 'shared' && (initial || changed)) { current = structuredClone(shared); if (current.challenge.totalPages !== STANDARD_PAGES) view = 'pages'; render(); }
    if (initial) { $('calc-start').value = data.challenge.startDate; $('calc-end').value = data.challenge.endDate; $('calc-pages').value = data.challenge.totalPages; renderCalculator(); }
  } catch (error) {
    showError(shared ? 'Couldn’t refresh the shared progress. Showing the last loaded update; we’ll try again shortly.' : 'We couldn’t load the shared progress. Please refresh the page. If this continues, check dist/progress.json in the repository.');
    if (initial) { setText('reader-rows', 'Progress is temporarily unavailable. The pace calculator still works.'); $('leaderboard').setAttribute('aria-busy', 'false'); renderCalculator(); }
    console.error('Progress loading:', error.message);
  }
}

renderCalculator();
loadProgress(true);
setInterval(() => { if (current && lastToday !== getToday()) { render(); renderCalculator(); } }, 60000);
setInterval(() => { if (!document.hidden) loadProgress(); }, 300000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { loadProgress(); if (current) { render(); renderCalculator(); } } });

if (navigator.modelContext?.registerTool) {
  navigator.modelContext.registerTool({ name: 'get_dayfam_progress', description: 'Read the shared DayFam Book of Mormon challenge, page counts, and today’s target.', inputSchema: { type: 'object', properties: {} }, execute: async () => ({ content: [{ type: 'text', text: JSON.stringify(shared ? { ...shared, today: pace(shared.challenge, dateInZone(shared.challenge.timeZone)) } : { error: 'Progress is not loaded yet.' }) }] }) });
  navigator.modelContext.registerTool({ name: 'calculate_reading_pace', description: 'Calculate daily reading pace, including the start and end dates.', inputSchema: { type: 'object', properties: { startDate: { type: 'string' }, endDate: { type: 'string' }, totalPages: { type: 'integer' } }, required: ['startDate', 'endDate', 'totalPages'] }, execute: async args => ({ content: [{ type: 'text', text: JSON.stringify(pace(args, dateInZone(shared?.challenge.timeZone ?? 'America/Denver'))) }] }) });
}
