import { ranked, chapterProgress } from './core.mjs?v=20261008-story';
import { regionAt, storyAsset } from './story.mjs?v=20261008-story';
import { BASE, $, text, icon, avatar, personStyle, locationLabel, renderStats, boot } from './shared.mjs?v=20261008-story';

boot((data, guide) => {
  const plan = renderStats(data), members = ranked(data.members);
  const isMaps = document.body.dataset.view === 'maps';
  const root = $('family-list'); root.replaceChildren();
  members.forEach((member, index) => {
    const percent = member.page / data.challenge.totalPages * 100;
    const row = document.createElement(isMaps ? 'a' : 'li');
    row.className = isMaps ? 'map-card' : `reader-row${member.rank === 1 ? ' leader' : ''}`;
    row.style.cssText = `${personStyle(member.name)};--fill:${percent}%;--index:${index}`;
    const href = `${BASE}journeys/${member.name.toLowerCase()}/`;
    const status = member.page === data.challenge.totalPages ? 'Finished!' : member.page === 0 ? 'Not started' : member.page >= plan.target ? `${member.page - plan.target} pages ahead` : `${plan.target - member.page} to today’s goal`;
    if (isMaps) {
      row.href = href; row.setAttribute('aria-label', `Open ${member.name}’s journey, page ${member.page}`);
      row.innerHTML = `<div class="map-card-top"><div class="person"><div class="person-copy"><h2>${member.name}</h2><p>${locationLabel(guide.books, member.page)}</p></div></div><span class="map-rank">${member.rank ? `#${member.rank}` : '—'}</span></div><div class="map-preview" aria-hidden="true"><span class="preview-node first">${icon(member.page ? 'check' : 'book-open')}</span><span class="preview-dot"></span><span class="preview-dot"></span><span class="preview-node middle">${icon('star')}</span><span class="preview-dot"></span><span class="preview-dot"></span><span class="preview-node last">${icon('flag')}</span></div><div class="map-card-bottom"><span><strong>Page ${member.page}</strong><small>${percent.toFixed(1)}% of the story</small></span><span class="open-journey">Open journey ${icon('chevron-right')}</span></div>`;
      row.querySelector('.person').prepend(avatar(member));
      const chapter = chapterProgress(guide.books, member.page).current;
      const region = chapter ? regionAt(chapter.slug, chapter.number) : regionAt('moro', 10);
      row.querySelector('.map-preview').style.backgroundImage = `url("${new URL(BASE + storyAsset(region.image), location.href).href}")`;
    } else {
      row.innerHTML = `<span class="rank ${member.rank === 1 ? 'winner' : ''}">${member.rank === 1 ? icon('trophy') : member.rank ?? '—'}</span><a class="person" href="${href}" aria-label="Open ${member.name}’s reading journey"><div class="person-copy"><h2>${member.name}</h2><p>${locationLabel(guide.books, member.page)}</p></div></a><div class="reading-progress"><div class="progress-bar" role="progressbar" aria-label="${member.name}’s reading progress" aria-valuenow="${member.page}" aria-valuemin="0" aria-valuemax="${data.challenge.totalPages}"><span></span><i></i></div><span class="reader-status ${member.page >= plan.target && member.page > 0 ? 'ahead' : ''}">${status}</span></div><span class="page-count"><strong>${member.page}</strong><small>/ ${data.challenge.totalPages}</small></span><a class="map-link" href="${href}" aria-label="View ${member.name}’s journey map">${icon('chevron-right')}</a>`;
      row.querySelector('.person').prepend(avatar(member));
    }
    root.append(row);
  });
  text('updated-label', data.updatedAt ? `Updated ${new Date(data.updatedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', timeZone:data.challenge.timeZone })}` : 'Waiting for the first check-in');
});
