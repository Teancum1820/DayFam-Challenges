import { chapterProgress, STANDARD_PAGES } from './core.mjs?v=20261008-story';
import { BASE, $, text, icon, avatar, personStyle, locationLabel, renderStats, boot } from './shared.mjs?v=20261008-story';
import { REGIONS, WORLDS, LANDMARKS, storyAsset } from './story.mjs?v=20261008-story';

const pattern = [0, 9, 13, 8, 0, -9, -13, -8];
let selected, currentChapterId, sceneryObserver;
const assetUrl = name => new URL(BASE + storyAsset(name), location.href).href;
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

function image(name, className = '', eager = false) {
  const img = document.createElement('img');
  img.src = assetUrl(name); img.alt = ''; img.className = className;
  img.width = 320; img.height = 320; img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
  return img;
}
function jumpCurrent() {
  document.getElementById(currentChapterId || 'journey-finish')?.scrollIntoView({behavior:motion(),block:'center'});
}
function showChapter(chapter) {
  text('chapter-book', chapter.book); text('chapter-title', 'Chapter ' + chapter.number);
  text('chapter-pages', (chapter.startPage === chapter.endPage ? 'Page ' + chapter.startPage : 'Pages ' + chapter.startPage + '–' + chapter.endPage) + ' · Standard English edition');
  const state = selected.page >= chapter.endPage ? 'completed' : chapter.id === currentChapterId ? 'current' : 'upcoming';
  text('chapter-status', state === 'completed' ? selected.name + ' has finished every printed page of this chapter.' : state === 'current' ? selected.name + ' is at page ' + selected.page + '. This chapter is complete when page ' + chapter.endPage + ' has been fully read.' : 'Still ahead on ' + selected.name + '’s journey. This chapter begins on page ' + chapter.startPage + '.');
  const landmark = LANDMARKS[chapter.id], story = $('chapter-story');
  story.replaceChildren(); story.hidden = !landmark;
  if (landmark) {
    const copy = document.createElement('div'), title = document.createElement('h3'), description = document.createElement('p');
    title.textContent = landmark.title; description.textContent = landmark.description;
    copy.append(title, description); story.append(image(landmark.asset, 'detail-art', true), copy);
  }
  $('chapter-read').href = 'https://www.churchofjesuschrist.org/study/scriptures/bofm/' + chapter.slug + '/' + chapter.number + '?lang=eng';
  $('chapter-detail').showModal();
}
function observeScenery() {
  sceneryObserver?.disconnect();
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-scenery]').forEach(el => el.style.setProperty('--world-image', 'url("' + el.dataset.scenery + '")'));
    return;
  }
  sceneryObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.setProperty('--world-image', 'url("' + entry.target.dataset.scenery + '")');
        sceneryObserver.unobserve(entry.target);
      }
    });
  }, {rootMargin:'800px 0px'});
  document.querySelectorAll('[data-scenery]').forEach(el => sceneryObserver.observe(el));
}
function makeStep(chapter, book, index, connects, member, targetChapter, plan) {
  const detail = {...chapter,book:book.name,slug:book.slug,id:book.slug+'-'+chapter.number};
  const landmark = LANDMARKS[detail.id], done = member.page >= chapter.endPage, current = detail.id === currentChapterId;
  const x = pattern[index % pattern.length], nextX = pattern[(index + 1) % pattern.length];
  const step = document.createElement('li');
  step.id = detail.id; step.className = 'chapter-step ' + (done ? 'done' : current ? 'current' : 'upcoming') + (x >= 0 ? ' label-left' : '') + (landmark ? ' story-step' : '');
  step.style.setProperty('--node-x', x + '%');
  if (current) step.setAttribute('aria-current','step');
  if (connects) {
    const d = 'M '+(50+x)+' 0 C '+(50+x)+' 62, '+(50+nextX)+' 62, '+(50+nextX)+' 124';
    step.innerHTML = '<svg class="path-link" viewBox="0 0 100 124" preserveAspectRatio="none" aria-hidden="true"><path class="road-base" d="'+d+'" vector-effect="non-scaling-stroke"/><path class="road-line" d="'+d+'" vector-effect="non-scaling-stroke"/></svg>';
    const count = chapter.endPage - chapter.startPage;
    for (let n=0; n<count; n++) {
      const t=(n+1)/(count+1), curve=3*t*t-2*t*t*t, px=x*(1-curve)+nextX*curve, y=(186*t-186*t*t+124*t*t*t)/124;
      const dot=document.createElement('span'); dot.className='page-dot'+(chapter.startPage+n<=member.page?' read':'');
      dot.style.cssText='--dot-x:'+px+'%;--dot-y:calc(61px + '+y+' * var(--step-size))';
      dot.title='Page '+(chapter.startPage+n); dot.setAttribute('aria-hidden','true'); step.append(dot);
    }
  }
  const button=document.createElement('button'); button.className='chapter-node'; button.type='button';
  button.setAttribute('aria-label',book.name+' chapter '+chapter.number+', pages '+chapter.startPage+' to '+chapter.endPage+', '+(done?'completed':current?'current chapter':'still to come'));
  button.innerHTML=done?icon('check'):current?icon('star'):'<span class="node-number">'+chapter.number+'</span>';
  button.addEventListener('click',()=>showChapter(detail)); step.append(button);
  const label=document.createElement('span'); label.className='chapter-label';
  label.innerHTML='<strong>Chapter '+chapter.number+'</strong><small>'+(chapter.startPage===chapter.endPage?'p. '+chapter.startPage:'pp. '+chapter.startPage+'–'+chapter.endPage)+'</small>'; step.append(label);
  if (landmark) {
    const figure=document.createElement('figure'); figure.className='story-landmark'+(landmark.asset.startsWith('world-')?' scene-landmark':'');
    const caption=document.createElement('figcaption'); caption.textContent=landmark.title;
    figure.append(image(landmark.asset,'landmark-art',detail.id==='1-ne-1'),caption); step.append(figure);
  }
  if (current) {
    const tag=document.createElement('span'); tag.className='place-tag';
    tag.textContent=member.page?'YOU ARE HERE · PAGE '+member.page:'START HERE'; step.append(tag);
  }
  if (detail.id===targetChapter && plan.state==='active') {
    const tag=document.createElement('span'); tag.className='target-tag'; tag.textContent='TODAY’S GOAL · PAGE '+plan.target; step.append(tag);
  }
  return step;
}

boot((data,guide)=>{
  const member=data.members.find(m=>m.name===document.body.dataset.member);
  if (!member) throw new Error('This reader was not found.');
  selected=member;
  const plan=renderStats(data), progress=chapterProgress(guide.books,member.page);
  currentChapterId=progress.current?.id; document.body.style.cssText=personStyle(member.name);
  const summary=$('reader-summary'); summary.style.cssText=personStyle(member.name)+';--fill:'+member.page/data.challenge.totalPages*100+'%';
  summary.innerHTML='<h2>'+member.name+'</h2><p class="summary-page"><strong>Page '+member.page+'</strong> of '+data.challenge.totalPages+'</p><div class="summary-progress"><div class="progress-bar" role="progressbar" aria-label="'+member.name+'’s reading progress" aria-valuenow="'+member.page+'" aria-valuemin="0" aria-valuemax="'+data.challenge.totalPages+'"><span></span><i></i></div></div><p class="summary-location">'+(member.page?'Reading: ':'Up next: ')+locationLabel(guide.books,member.page)+'</p><p class="summary-count">'+progress.completed+' of 239 chapters complete</p>';
  summary.prepend(avatar(member));
  const select=$('book-jump'); select.replaceChildren();
  guide.books.forEach((book,i)=>{const option=document.createElement('option');option.value=book.slug;option.textContent=(i+1)+'. '+book.name;select.append(option);});
  const path=$('journey-path'); path.replaceChildren(); $('floating-current').hidden=true;
  if (data.challenge.totalPages!==STANDARD_PAGES) {
    const notice=document.createElement('p');notice.className='notice';notice.textContent='Chapter maps use the standard 531-page English edition. This challenge has a different page count.';path.append(notice);return;
  }
  const targetChapter=plan.target>0?chapterProgress(guide.books,Math.max(0,plan.target-1)).current?.id:null;
  guide.books.forEach((book,bookIndex)=>{
    const section=document.createElement('section');section.className='book-section';section.id='book-'+book.slug;section.setAttribute('aria-labelledby','title-'+book.slug);
    const firstWorld=WORLDS[REGIONS[book.slug][0][2]], completed=book.chapters.filter(ch=>member.page>=ch.endPage).length;
    section.style.cssText='--book-color:'+firstWorld.color+';--book-depth:'+firstWorld.depth;
    const banner=document.createElement('header');banner.className='book-banner';
    banner.innerHTML='<div><span class="eyebrow">BOOK '+String(bookIndex+1).padStart(2,'0')+' / 15</span><h3 id="title-'+book.slug+'">'+book.name+'</h3><p>Pages '+book.startPage+'–'+book.endPage+' · '+book.chapters.length+' '+(book.chapters.length===1?'chapter':'chapters')+' · '+completed+' complete</p></div>';
    banner.append(image(firstWorld.image,'book-banner-art'));section.append(banner);
    REGIONS[book.slug].forEach(([from,to,key,title])=>{
      const world=WORLDS[key], region=document.createElement('div');region.className='world-section world-'+key;region.dataset.scenery=assetUrl(world.image);
      region.style.cssText='--world-bg:'+world.bg+';--world-accent:'+world.color+';--world-depth:'+world.depth;
      const heading=document.createElement('div');heading.className='world-caption';
      const chapters=book.chapters.filter(ch=>ch.number>=from && ch.number<=to);
      heading.innerHTML='<h4>'+title+'</h4><span>Pages '+chapters[0].startPage+'–'+chapters.at(-1).endPage+'</span>';region.append(heading);
      const list=document.createElement('ol');list.className='chapter-list';list.setAttribute('aria-label',book.name+' chapters '+from+' to '+to);list.start=from;
      chapters.forEach((chapter,i)=>list.append(makeStep(chapter,book,chapter.number-1,i<chapters.length-1,member,targetChapter,plan)));
      region.append(list);section.append(region);
    });
    const end=document.createElement('div');end.className='book-end';
    end.innerHTML=icon(completed===book.chapters.length?'check':'flag')+'<span>'+book.name+' '+(completed===book.chapters.length?'complete':'finish line · page '+book.endPage)+'</span>';section.append(end);path.append(section);
  });
  const finish=document.createElement('section');finish.className='journey-finish';finish.id='journey-finish';
  finish.innerHTML='<span class="eyebrow">CHRISTMAS DAY FINISH LINE</span><h2>Moroni 10 · Page 531</h2><p>'+(member.page>=531?'You finished the Book of Mormon!':'The final chapter of your reading journey.')+'</p>';
  path.append(finish);$('floating-current').hidden=false;observeScenery();
});
$('jump-current').addEventListener('click',jumpCurrent);
$('floating-current').addEventListener('click',jumpCurrent);
$('book-jump').addEventListener('change',event=>document.getElementById('book-'+event.target.value)?.scrollIntoView({behavior:motion(),block:'start'}));
$('close-chapter').addEventListener('click',()=>$('chapter-detail').close());
