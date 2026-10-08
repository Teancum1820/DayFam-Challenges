import { chapterProgress, STANDARD_PAGES } from './core.mjs?v=20261008';
import { $, text, icon, avatar, personStyle, locationLabel, renderStats, boot } from './shared.mjs?v=20261008';

const pattern = [0, 10, 15, 10, 0, -10, -15, -10];
let selected, currentChapterId;
function jumpCurrent() {
  document.getElementById(currentChapterId || 'journey-finish')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
function showChapter(chapter) {
  text('chapter-book', chapter.book); text('chapter-title', `Chapter ${chapter.number}`);
  text('chapter-pages', chapter.startPage === chapter.endPage ? `Page ${chapter.startPage} · Standard English edition` : `Pages ${chapter.startPage}–${chapter.endPage} · Standard English edition`);
  const state = selected.page >= chapter.endPage ? 'completed' : chapter.id === currentChapterId ? 'current' : 'upcoming';
  text('chapter-status', state === 'completed' ? `${selected.name} has finished every printed page of this chapter.` : state === 'current' ? `${selected.name} is at page ${selected.page}. This chapter is complete when page ${chapter.endPage} has been fully read.` : `Still ahead on ${selected.name}’s journey. This chapter begins on page ${chapter.startPage}.`);
  $('chapter-read').href = `https://www.churchofjesuschrist.org/study/scriptures/bofm/${chapter.slug}/${chapter.number}?lang=eng`;
  $('chapter-detail').showModal();
}

boot((data, guide) => {
  const member = data.members.find(m => m.name === document.body.dataset.member);
  if (!member) throw new Error('This reader was not found.');
  selected = member;
  const plan = renderStats(data), progress = chapterProgress(guide.books, member.page);
  currentChapterId = progress.current?.id;
  document.body.style.cssText = personStyle(member.name);
  const summary = $('reader-summary'); summary.style.cssText = `${personStyle(member.name)};--fill:${member.page / data.challenge.totalPages * 100}%`;
  summary.innerHTML = `<h2>${member.name}</h2><p class="summary-page"><strong>Page ${member.page}</strong> of ${data.challenge.totalPages}</p><div class="summary-progress"><div class="progress-bar" role="progressbar" aria-label="${member.name}’s reading progress" aria-valuenow="${member.page}" aria-valuemin="0" aria-valuemax="${data.challenge.totalPages}"><span></span><i></i></div></div><p class="summary-location">${member.page ? 'Reading' : 'Up next'}: ${locationLabel(guide.books, member.page)}</p><p class="summary-count">${progress.completed} of 239 chapters complete</p>`;
  summary.prepend(avatar(member));
  const select = $('book-jump'); select.replaceChildren();
  guide.books.forEach((book, i) => { const option = document.createElement('option'); option.value = book.slug; option.textContent = `${i + 1}. ${book.name}`; select.append(option); });
  const path = $('journey-path'); path.replaceChildren();
  if (data.challenge.totalPages !== STANDARD_PAGES) { const notice = document.createElement('p'); notice.className = 'notice'; notice.textContent = 'Chapter maps use the standard 531-page English edition. This challenge has a different page count.'; path.append(notice); return; }
  const targetChapter = plan.target > 0 ? chapterProgress(guide.books, Math.max(0, plan.target - 1)).current?.id : null;
  guide.books.forEach((book, bookIndex) => {
    const section = document.createElement('section'); section.className = 'book-section'; section.id = `book-${book.slug}`; section.setAttribute('aria-labelledby', `title-${book.slug}`);
    const completed = book.chapters.filter(chapter => member.page >= chapter.endPage).length;
    const banner = document.createElement('header'); banner.className = 'book-banner';
    banner.innerHTML = `<div><span class="eyebrow">BOOK ${String(bookIndex + 1).padStart(2, '0')} / 15</span><h2 id="title-${book.slug}">${book.name}</h2><p>Pages ${book.startPage}–${book.endPage} · ${book.chapters.length} ${book.chapters.length === 1 ? 'chapter' : 'chapters'} · ${completed} complete</p></div>${icon(completed === book.chapters.length ? 'check' : 'book-open')}`;
    section.append(banner);
    const list = document.createElement('ol'); list.className = 'chapter-list'; list.setAttribute('aria-label', `${book.name} chapters`);
    book.chapters.forEach((chapter, index) => {
      const detail = { ...chapter, book:book.name, slug:book.slug, id:`${book.slug}-${chapter.number}` };
      const done = member.page >= chapter.endPage, current = detail.id === currentChapterId;
      const x = pattern[index % pattern.length], nextX = pattern[(index + 1) % pattern.length];
      const step = document.createElement('li'); step.id = detail.id; step.className = `chapter-step ${done ? 'done' : current ? 'current' : 'upcoming'}${x >= 0 ? ' label-left' : ''}`; step.style.setProperty('--node-x', `${x}%`);
      if (current) step.setAttribute('aria-current', 'step');
      if (index < book.chapters.length - 1) {
        step.innerHTML = `<svg class="path-link" viewBox="0 0 100 124" preserveAspectRatio="none" aria-hidden="true"><path d="M ${50 + x} 0 C ${50 + x} 62, ${50 + nextX} 62, ${50 + nextX} 124" vector-effect="non-scaling-stroke"/></svg>`;
        // Small checkpoints represent the actual printed pages between chapter nodes.
        const count = chapter.endPage - chapter.startPage;
        for (let n = 0; n < count; n++) {
          const t = (n + 1) / (count + 1), bezierX = x * (1 - 3 * t * t + 2 * t * t * t) + nextX * (3 * t * t - 2 * t * t * t);
          const page = chapter.startPage + n;
          const dot = document.createElement('span'); dot.className = `page-dot${page <= member.page ? ' read' : ''}`;
          const y = (186 * t - 186 * t * t + 124 * t * t * t) / 124;
          dot.style.cssText = `--dot-x:${bezierX}%;--dot-y:calc(43px + ${y} * var(--step-size))`; dot.title = `Page ${page}`; dot.setAttribute('aria-hidden', 'true'); step.append(dot);
        }
      }
      const button = document.createElement('button'); button.className = 'chapter-node'; button.type = 'button';
      button.setAttribute('aria-label', `${book.name} chapter ${chapter.number}, pages ${chapter.startPage} to ${chapter.endPage}, ${done ? 'completed' : current ? 'current chapter' : 'still to come'}`);
      button.innerHTML = done ? icon('check') : current ? icon('star') : `<span class="node-number">${chapter.number}</span>`;
      button.addEventListener('click', () => showChapter(detail)); step.append(button);
      const label = document.createElement('span'); label.className = 'chapter-label';
      label.innerHTML = `<strong>Chapter ${chapter.number}</strong><small>${chapter.startPage === chapter.endPage ? `p. ${chapter.startPage}` : `pp. ${chapter.startPage}–${chapter.endPage}`}</small>`; step.append(label);
      if (current) { const tag = document.createElement('span'); tag.className = 'place-tag'; tag.textContent = member.page ? `YOU ARE HERE · PAGE ${member.page}` : 'YOUR STORY STARTS HERE'; step.append(tag); }
      if (detail.id === targetChapter && plan.state === 'active') { const tag = document.createElement('span'); tag.className = 'target-tag'; tag.textContent = `TODAY’S GOAL · PAGE ${plan.target}`; step.append(tag); }
      list.append(step);
    });
    section.append(list);
    const end = document.createElement('div'); end.className = 'book-end'; end.innerHTML = `${icon(completed === book.chapters.length ? 'check' : 'flag')}<span>${completed === book.chapters.length ? `${book.name} complete. A little win!` : `${book.name} finish line · page ${book.endPage}`}</span>`; section.append(end);
    path.append(section);
  });
  const finish = document.createElement('section'); finish.className = 'journey-finish'; finish.id = 'journey-finish';
  finish.innerHTML = `${icon('trophy')}<span class="eyebrow">THE CHRISTMAS FINISH LINE</span><h2>Moroni 10. Page 531.</h2><p>${member.page >= 531 ? 'Every chapter. Every page. You did it!' : '15 books. 239 chapters. One meaningful adventure.'}</p>`; path.append(finish);
  $('floating-current').hidden = false;
});

$('jump-current').addEventListener('click', jumpCurrent);
$('floating-current').addEventListener('click', jumpCurrent);
$('book-jump').addEventListener('change', event => document.getElementById(`book-${event.target.value}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start' }));
$('close-chapter').addEventListener('click', () => $('chapter-detail').close());
