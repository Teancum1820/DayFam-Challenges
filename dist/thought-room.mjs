import { THOUGHTS_API } from './config.mjs?v=20261108-study-room';

const $ = id => document.getElementById(id);
const form = $('thought-form'), name = $('display-name'), passage = $('passage'), thought = $('thought');
const send = $('post-thought'), list = $('thoughts'), empty = $('empty-feed');
const older = $('older-thoughts'), retry = $('retry-feed');
const state = { latest: null, oldest: null, more: false, refreshing: false, loadingOlder: false, saving: false };
const nodes = new Map();
const nameKey = 'dayfam-scripture-room-name';
const stamp = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const colors = ['#e0eee1','#f4ebd6','#ebe5f5','#e0ecf2','#f4e4df'];
let books = [], submission;

function status(id, message = '', error = false) {
  const element = $(id);
  if (element.textContent !== message) element.textContent = message;
  element.toggleAttribute('data-error', error);
}
function updateCount() { $('thought-count').textContent = thought.value.length.toLocaleString() + ' / 1,000'; }
function scriptureUrl(reference) {
  const match = reference.trim().match(/^(.+?)\s+(\d{1,2})(?:\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?$/u);
  if (!match) return '';
  const [, bookName, chapter, start, end] = match;
  const book = books.find(item => item.name.toLowerCase() === bookName.toLowerCase().replace(/\s+/g, ' '));
  if (!book?.chapters.some(item => item.number === Number(chapter)) || (start && Number(start) < 1) || (end && Number(end) < Number(start))) return '';
  const verse = start ? (end ? Number(start) + '-' + Number(end) : Number(start)) : '';
  return 'https://www.churchofjesuschrist.org/study/scriptures/bofm/' + book.slug + '/' + Number(chapter)
    + '?lang=eng' + (verse ? '&id=p' + verse + '#p' + Number(start) : '');
}
function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function makePassage(reference) {
  const href = scriptureUrl(reference);
  const node = element(href ? 'a' : 'span', 'thought-passage', reference);
  if (href) { node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  return node;
}
function createPost(post) {
  const li = element('li', 'thought-item');
  const initials = post.name.trim().split(/\s+/u).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
  const avatar = element('span', 'thought-avatar', initials);
  avatar.setAttribute('aria-hidden', 'true');
  const hue = Array.from(post.name.toLowerCase()).reduce((sum, char) => (sum + char.codePointAt(0)) % colors.length, 0);
  avatar.style.setProperty('--avatar-bg', colors[hue]);
  const body = element('div'), meta = element('div', 'thought-meta'), bubble = element('div', 'thought-bubble');
  const time = element('time', '', stamp.format(new Date(post.createdAt)));
  time.dateTime = post.createdAt;
  meta.append(element('strong', '', post.name), time);
  bubble.append(makePassage(post.passage), element('p', '', post.thought));
  body.append(meta, bubble);
  li.append(avatar, body);
  return li;
}
function addPosts(posts) {
  for (const post of posts) {
    if (nodes.has(post.id)) continue;
    const node = createPost(post);
    const next = [...nodes.keys()].filter(id => id < post.id).reduce((max, id) => Math.max(max, id), 0);
    list.insertBefore(node, nodes.get(next) ?? null);
    nodes.set(post.id, node);
  }
  empty.hidden = nodes.size !== 0;
}
async function request(query = {}, payload) {
  const url = new URL(THOUGHTS_API);
  url.search = new URLSearchParams(query);
  let response;
  try {
    response = await fetch(url, {
      cache: 'no-store', signal: AbortSignal.timeout(12000),
      ...(payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {})
    });
  } catch { throw new Error('Could not reach the room. Check your connection and try again.'); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 404 ? 'The room is temporarily unavailable.' : body.error || 'The room is temporarily unavailable. Try again.');
  if (payload ? !Number.isSafeInteger(body.id) : !Array.isArray(body.thoughts)) throw new Error('Could not read the conversation. Try again.');
  return body;
}
function updateOlder() { older.hidden = !state.more; older.disabled = state.loadingOlder; }
async function refresh() {
  if (state.refreshing || document.hidden) return;
  state.refreshing = true;
  retry.disabled = true;
  try {
    if (!state.latest) {
      const page = await request();
      addPosts(page.thoughts);
      state.latest = page.thoughts[0]?.id ?? null;
      state.oldest = page.thoughts.at(-1)?.id ?? null;
      state.more = page.hasMore;
      updateOlder();
    } else {
      // Catch up in bounded batches without disturbing the older page cursor.
      for (let i = 0; i < 3; i++) {
        const page = await request({ after: state.latest });
        addPosts(page.thoughts);
        state.latest = page.thoughts.at(-1)?.id ?? state.latest;
        if (!page.hasMore) break;
      }
    }
    retry.hidden = true;
    status('feed-status');
    send.disabled = state.saving;
  } catch (error) {
    retry.hidden = false;
    status('feed-status', nodes.size ? 'Could not refresh. Showing the last thoughts loaded.' : error.message, true);
  } finally { state.refreshing = false; retry.disabled = false; }
}
retry.addEventListener('click', refresh);
older.addEventListener('click', async () => {
  if (state.loadingOlder || !state.oldest) return;
  state.loadingOlder = true;
  updateOlder();
  try {
    const page = await request({ before: state.oldest });
    addPosts(page.thoughts);
    state.oldest = page.thoughts.at(-1)?.id ?? state.oldest;
    state.more = page.hasMore;
    status('feed-status');
  } catch { status('feed-status', 'Could not load older thoughts. Try again.', true); }
  finally { state.loadingOlder = false; updateOlder(); }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (state.saving) return;
  const draft = { name: name.value.trim(), passage: passage.value.trim(), thought: thought.value.trim() };
  const missing = !draft.name ? name : !draft.passage ? passage : !draft.thought ? thought : null;
  if (missing) {
    status('form-status', 'Add your display name, scripture reference, and thought before posting.', true);
    missing.focus();
    return;
  }
  const key = JSON.stringify(draft);
  if (submission?.key !== key) submission = { key, id: crypto.randomUUID() };
  state.saving = true;
  send.disabled = true;
  status('form-status', 'Posting your thought…');
  try {
    const posted = await request({}, { ...draft, submissionId: submission.id });
    addPosts([posted]);
    try { localStorage.setItem(nameKey, draft.name); } catch {}
    if (thought.value.trim() === draft.thought) thought.value = '';
    updateCount();
    submission = null;
    status('form-status', 'Your thought was posted.');
    void refresh();
  } catch (error) { status('form-status', error.message, true); }
  finally { state.saving = false; send.disabled = false; }
});
thought.addEventListener('input', updateCount);
try { name.value = (localStorage.getItem(nameKey) || '').slice(0, 32); } catch {}
passage.value = (new URLSearchParams(location.search).get('passage') || '').slice(0, 80);
updateCount();

fetch(new URL('../chapters.json', location.href)).then(response => response.ok ? response.json() : null).then(data => {
  if (!data) return;
  books = data.books;
  list.querySelectorAll('span.thought-passage').forEach(node => {
    if (scriptureUrl(node.textContent)) node.replaceWith(makePassage(node.textContent));
  });
}).catch(() => {});
void refresh();
setInterval(refresh, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
