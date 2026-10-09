import { pace, dateInZone, validateData, chapterProgress, validateChapters } from './core.mjs?v=20261009-editing';
import { PROGRESS_API } from './config.mjs?v=20261009-editing';

export const BASE = document.body.dataset.base || './';
export const COLORS = {
  Caleb: ['#37813a', '#e8f5df', '#25642b'], Katelyn: ['#bc5b14', '#fff0df', '#92450e'],
  Elizabeth: ['#ce5d95', '#fce7f2', '#a54074'], Benjamin: ['#269782', '#e1f5ee', '#197562'],
  Aaron: ['#bc9029', '#fff5d7', '#926c18'], Lydia: ['#4c87c4', '#e5f0ff', '#3269a2'],
  Mom: ['#8b57ad', '#f2e8fb', '#6d3e90']
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
let source, renderCallback, lastDay, sharedAvailable = false, saving = false, editRevision, noticeTimer;
async function requestProgress(update) {
  const response = await fetch(PROGRESS_API, {
    method: update ? 'PATCH' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(12000),
    ...(update ? { headers: {'Content-Type':'application/json'}, body:JSON.stringify(update) } : {})
  }).catch(() => { throw new Error('Check your connection and try saving again.'); });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || 'The shared progress could not be reached.');
    if (response.status === 409 && body.data) error.latest = validateData(body.data);
    throw error;
  }
  return validateData(body);
}
function setEditing(available) {
  sharedAvailable = available;
  document.querySelectorAll('[data-edit-member], #open-progress').forEach(button => { button.disabled = !available; });
}
function applyProgress(data) {
  source.data = data; renderCallback(data, source.guide); setEditing(true);
  $('error-banner').hidden = true;
}
export async function boot(render) {
  renderCallback = render;
  setupInstructions(); setupProgressEditor();
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  try {
    const [data, chapters] = await Promise.all([
      requestProgress().then(data => { sharedAvailable = true; return data; }).catch(async () => {
        const fallback = await fetch(BASE + 'progress.json', {cache:'no-store'});
        if (!fallback.ok) throw new Error('Reading data is unavailable.');
        return validateData(await fallback.json());
      }), fetch(BASE + 'chapters.json')
    ]);
    if (!chapters.ok) throw new Error('Reading data is unavailable.');
    source = { data, guide: validateChapters(await chapters.json()) };
    lastDay = dateInZone(source.data.challenge.timeZone); render(source.data, source.guide); $('content')?.setAttribute('aria-busy', 'false');
    setEditing(sharedAvailable);
    if (!sharedAvailable) showError('Showing last published progress. Shared editing is temporarily unavailable.');
    setInterval(refresh, 15000);
    setInterval(() => { if (source && dateInZone(source.data.challenge.timeZone) !== lastDay) { lastDay = dateInZone(source.data.challenge.timeZone); renderCallback(source.data, source.guide); setEditing(sharedAvailable); } }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  } catch (error) { showError('The reading data couldn’t load. Refresh to try again.'); $('content')?.setAttribute('aria-busy', 'false'); console.error(error.message); }
}
async function refresh() {
  if (document.hidden || !source || $('progress-editor').open || saving) return;
  try {
    const data = await requestProgress();
    if (JSON.stringify(data) !== JSON.stringify(source.data)) applyProgress(data);
    setEditing(true);
    $('error-banner').hidden = true;
  } catch { setEditing(false); showError('Showing the last loaded progress. Shared editing will return when the connection recovers.'); }
}
function showError(message) { text('error-banner', message); $('error-banner').hidden = false; }

function setupProgressEditor() {
  const dialog = $('progress-editor'), form = $('progress-form'), reader = $('progress-reader'), page = $('progress-page');
  const status = $('progress-status'), save = $('save-progress');
  function chooseReader() {
    const member = source.data.members.find(member => member.name === reader.value);
    page.value = member.page; page.max = source.data.challenge.totalPages; editRevision = member.revision;
    status.textContent = ''; status.className = 'progress-status';
  }
  function openEditor(name) {
    if (!source || !sharedAvailable) return;
    reader.replaceChildren(...source.data.members.map(member => {
      const option = document.createElement('option'); option.value = member.name; option.textContent = member.name; return option;
    }));
    reader.value = name || document.body.dataset.member || source.data.members[0].name;
    chooseReader(); dialog.showModal(); page.focus(); page.select();
  }
  $('open-progress').addEventListener('click', () => openEditor());
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-edit-member]');
    if (button && !button.disabled) openEditor(button.dataset.editMember);
  });
  reader.addEventListener('change', chooseReader);
  for (const id of ['close-progress','cancel-progress']) $(id).addEventListener('click', () => { if (!saving) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (saving || !form.reportValidity()) return;
    saving = true; save.textContent = 'Saving…'; status.textContent = ''; status.className = 'progress-status';
    $('close-progress').disabled = true;
    const name = reader.value;
    for (const control of form.elements) control.disabled = true;
    try {
      const data = await requestProgress({ name, page:Number(page.value), revision:editRevision });
      applyProgress(data); dialog.close();
      text('save-notice', name + '’s progress saved for everyone.'); $('save-notice').hidden = false;
      clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { $('save-notice').hidden = true; }, 6000);
    } catch (error) {
      status.classList.add('error');
      if (error.latest) {
        applyProgress(error.latest);
        const latest = source.data.members.find(member => member.name === name); editRevision = latest.revision;
        status.textContent = name + ' is now on page ' + latest.page + '. Someone updated this reader while you were editing. Your entry is still here; check it and save again.';
      } else status.textContent = 'Your change hasn’t been confirmed. ' + error.message;
    } finally {
      saving = false; save.textContent = 'Save progress';
      $('close-progress').disabled = false;
      for (const control of form.elements) control.disabled = false;
    }
  });
}

function setupInstructions() {
  $('open-instructions').addEventListener('click', () => $('instructions').showModal());
  for (const id of ['close-instructions', 'done-instructions']) {
    $(id).addEventListener('click', () => $('instructions').close());
  }
}
