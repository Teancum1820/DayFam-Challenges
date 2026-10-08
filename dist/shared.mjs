import { pace, dateInZone, validateData, chapterProgress, validateChapters } from './core.mjs?v=20261008';

export const BASE = document.body.dataset.base || './';
export const COLORS = {
  Caleb: ['#8050cf', '#eee5fc', '#6034a8'], Katelyn: ['#d87941', '#fff0e5', '#ae552c'],
  Elizabeth: ['#ce5d95', '#fce7f2', '#a54074'], Benjamin: ['#269782', '#e1f5ee', '#197562'],
  Aaron: ['#bc9029', '#fff5d7', '#926c18'], Lydia: ['#4c87c4', '#e5f0ff', '#3269a2']
};
export const $ = id => document.getElementById(id);
export const text = (id, value) => { if ($(id)) $(id).textContent = value; };
export function icon(name, className = '') {
  const url = new URL(`${BASE}assets/icons/${name}.svg`, location.href).href;
  return `<span class="icon ${className}" aria-hidden="true" style="--icon:url('${url}')"></span>`;
}
export function personStyle(name) { const [accent, tint, shadow] = COLORS[name]; return `--accent:${accent};--tint:${tint};--depth:${shadow}`; }
export function avatar(member, className = '') {
  const span = document.createElement('span'); span.className = `avatar ${className}`; span.style.cssText = personStyle(member.name); span.textContent = member.name[0];
  if (member.avatar) { const image = document.createElement('img'); image.src = new URL(member.avatar, new URL(BASE, location.href)).href; image.alt = ''; image.addEventListener('error', () => { span.textContent = member.name[0]; }, { once: true }); span.replaceChildren(image); }
  return span;
}
export function shortDate(date) { return new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
export function locationLabel(books, page) {
  if (!page) return 'Ready for page 1';
  const current = chapterProgress(books, page).current;
  return current ? `${current.book} ${current.number}` : 'Moroni 10 · Finished';
}
export function renderStats(data) {
  const today = dateInZone(data.challenge.timeZone), plan = pace(data.challenge, today);
  text('daily-goal', plan.target); text('pages-per-day', plan.pagesPerDay.toFixed(2)); text('days-left', plan.remainingDays);
  text('goal-note', plan.state === 'upcoming' ? `Starts ${shortDate(data.challenge.startDate)}` : plan.state === 'finished' ? 'Challenge finished' : `By the end of ${shortDate(today)}`);
  text('pace-note', `${data.challenge.totalPages} pages · ${plan.totalDays} reading days`); text('finish-note', `Finish ${shortDate(data.challenge.endDate)}`);
  text('challenge-dates', `${shortDate(data.challenge.startDate)} – ${shortDate(data.challenge.endDate)}, ${data.challenge.endDate.slice(0, 4)}`);
  return plan;
}
let source, renderCallback, timer, lastDay;
export async function boot(render) {
  renderCallback = render;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  try {
    const [progress, chapters] = await Promise.all([fetch(BASE + 'progress.json', { cache: 'no-store' }), fetch(BASE + 'chapters.json')]);
    if (!progress.ok || !chapters.ok) throw new Error('Reading data is unavailable.');
    source = { data: validateData(await progress.json()), guide: validateChapters(await chapters.json()) };
    lastDay = dateInZone(source.data.challenge.timeZone); render(source.data, source.guide); $('content')?.setAttribute('aria-busy', 'false'); setupEditor();
    setInterval(refresh, 300000);
    setInterval(() => { if (source && dateInZone(source.data.challenge.timeZone) !== lastDay) { lastDay = dateInZone(source.data.challenge.timeZone); renderCallback(source.data, source.guide); } }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  } catch (error) { showError('The reading data couldn’t load. Refresh to try again.'); $('content')?.setAttribute('aria-busy', 'false'); console.error(error.message); }
}
async function refresh() {
  if (document.hidden || !$('preview-banner')?.hidden) return;
  try {
    const response = await fetch(BASE + 'progress.json', { cache: 'no-store' }); if (!response.ok) throw new Error('Refresh failed');
    const data = validateData(await response.json());
    if (JSON.stringify(data) !== JSON.stringify(source.data)) { source.data = data; renderCallback(source.data, source.guide); }
    $('error-banner').hidden = true;
  } catch { showError('Showing the last loaded progress. We’ll try to refresh again shortly.'); }
}
function showError(message) { text('error-banner', message); $('error-banner').hidden = false; }
function toast(message) { text('toast', message); $('toast').hidden = false; clearTimeout(timer); timer = setTimeout(() => { $('toast').hidden = true; }, 3500); }

function setupEditor() {
  const container = document.createElement('div');
  container.innerHTML = `<dialog id="editor" aria-labelledby="editor-title"><div class="dialog-head"><div><span class="eyebrow">FAMILY CHECK-IN</span><h2 id="editor-title">Update everyone’s pages</h2></div><button class="close-button" id="close-editor" aria-label="Close progress editor">${icon('x')}</button></div><p>Enter the last page fully read. Changes stay in this tab until you publish the shared file.</p><form id="progress-form"><div id="editor-fields" class="editor-fields"></div><p id="editor-error" class="form-error" role="alert" hidden></p><button class="button primary full" type="submit">Preview updates</button></form><div id="publish-help" hidden><h3>Share these updates</h3><p>Copy the data, open the shared file on GitHub, replace its contents, and commit the change. GitHub Pages publishes it automatically.</p><div class="publish-actions"><button class="button small" id="copy-json">${icon('copy')}Copy data</button><button class="button small" id="download-json">${icon('download')}Download file</button><a class="button small" href="https://github.com/Teancum1820/DayFam-Challenges/edit/main/dist/progress.json" target="_blank" rel="noopener noreferrer">Open shared file</a></div><p id="copy-status" role="status"></p></div></dialog>`;
  document.body.append(container);
  let draft;
  $('edit-progress').disabled = false;
  $('edit-progress').addEventListener('click', () => {
    $('editor-fields').replaceChildren();
    source.data.members.forEach(member => {
      const label = document.createElement('label'); label.innerHTML = `<span>${member.name}</span><input name="${member.name}" type="number" min="0" max="${source.data.challenge.totalPages}" step="1" value="${member.page}" required aria-label="Last completed page for ${member.name}">`; label.prepend(avatar(member)); $('editor-fields').append(label);
    });
    $('publish-help').hidden = true; $('editor-error').hidden = true; text('copy-status', ''); $('editor').showModal();
  });
  $('close-editor').addEventListener('click', () => $('editor').close());
  $('progress-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      draft = structuredClone(source.data); const values = new FormData(event.target);
      draft.members.forEach(member => { member.page = Number(values.get(member.name)); }); draft.updatedAt = new Date().toISOString(); validateData(draft);
      renderCallback(draft, source.guide); $('preview-banner').hidden = false; $('publish-help').hidden = false; $('editor-error').hidden = true; toast('Preview ready. Publish the file to update everyone.');
    } catch (error) { text('editor-error', error.message); $('editor-error').hidden = false; }
  });
  $('return-shared').addEventListener('click', () => { $('preview-banner').hidden = true; renderCallback(source.data, source.guide); });
  $('copy-json').addEventListener('click', async () => {
    if (!draft) return;
    try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2) + '\n'); text('copy-status', 'Copied. Paste over the entire shared progress.json file.'); }
    catch { text('copy-status', 'Copy isn’t available here. Download the file instead.'); }
  });
  $('download-json').addEventListener('click', () => {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'progress.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
}
