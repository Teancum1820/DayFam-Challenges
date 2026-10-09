import { chapterProgress, STANDARD_PAGES } from './core.mjs?v=20261009-editing';
import { BASE, $, text, icon, avatar, personStyle, locationLabel, renderStats, boot } from './shared.mjs?v=20261009-editing';
import { REGIONS, WORLDS, LANDMARKS, storyAsset } from './story.mjs?v=20261009-editing';
import { chapterConnections } from './path.mjs?v=20261009-editing';

const pattern = [0, 9, 13, 8, 0, -9, -13, -8];
let selected, currentChapterId, sceneryObserver, layoutObserver, layoutFrame;
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

function setupJourneyLayout(path) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('journey-road'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
  path.prepend(svg);
  const scenes = [];
  path.querySelectorAll('.book-section').forEach(book => {
    const scenery = document.createElement('div'); scenery.className='book-scenery'; scenery.setAttribute('aria-hidden','true');
    const bases=document.createElement('div'), paints=document.createElement('div');
    bases.className='scenery-bases'; paints.className='scenery-paints'; scenery.append(bases,paints); book.prepend(scenery);
    const regions=[...book.querySelectorAll('.world-section')];
    regions.forEach((region,i)=>{
      const world=WORLDS[region.dataset.world];
      const previous=WORLDS[regions[i-1]?.dataset.world] || world;
      const next=WORLDS[regions[i+1]?.dataset.world] || world;
      const base=document.createElement('div'); base.className='scenery-zone';
      base.style.cssText=`--entry-bg:color-mix(in srgb,${previous.bg},${world.bg});--world-bg:${world.bg};--exit-bg:color-mix(in srgb,${world.bg},${next.bg})`;
      const art=document.createElement('div'); art.className='scenery-art'; art.dataset.scenery=assetUrl(world.image);
      bases.append(base); paints.append(art); scenes.push({book,region,base,art});
    });
  });
  function draw() {
    layoutFrame=null;
    const origin=path.getBoundingClientRect(), width=path.clientWidth, height=path.clientHeight;
    const bookRects=new Map([...path.querySelectorAll('.book-section')].map(book=>[book,{
      rect:book.getBoundingClientRect(),
      entry:book.querySelector('.book-banner').getBoundingClientRect().bottom-origin.top+18,
      exit:book.querySelector('.book-end').getBoundingClientRect().top-origin.top+book.querySelector('.book-end').offsetHeight/2
    }]));
    const sceneRects=scenes.map(scene=>({...scene,rect:scene.region.getBoundingClientRect()}));
    const points=[...path.querySelectorAll('.chapter-step')].map(step=>{
      const node=step.querySelector('.chapter-node').getBoundingClientRect(), book=step.closest('.book-section'), bounds=bookRects.get(book);
      return {id:step.id,book:book.id,x:node.left-origin.left+node.width/2,y:node.top-origin.top+node.height/2,
        startPage:Number(step.dataset.startPage),endPage:Number(step.dataset.endPage),entryY:bounds.entry,exitY:bounds.exit,
        color:WORLDS[step.closest('.world-section').dataset.world].color};
    });
    sceneRects.forEach(({book,rect,base,art})=>{
      const top=rect.top-bookRects.get(book).rect.top-book.clientTop;
      base.style.top=top+'px'; base.style.height=rect.height+'px';
      art.style.top=(top-90)+'px'; art.style.height=(rect.height+180)+'px';
      const tileHeight=book.clientWidth*1.5, blend=Math.min(120,tileHeight*.22), stride=tileHeight-blend;
      const count=Math.ceil((rect.height+180)/stride)+1;
      while(art.children.length<count) {const tile=document.createElement('div');tile.className='scenery-tile';art.append(tile);}
      while(art.children.length>count) art.lastElementChild.remove();
      [...art.children].forEach((tile,i)=>{tile.style.cssText=`top:${i*stride}px;height:${tileHeight}px;--tile-blend:${blend}px`;});
    });
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`); svg.style.height=height+'px'; svg.replaceChildren();
    const dots=[];
    chapterConnections(points,width).forEach(segment=>{
      const group=document.createElementNS(NS,'g');group.classList.add('road-segment');
      group.dataset.from=segment.from.id;group.dataset.to=segment.to.id;
      if(segment.bookBreak) group.dataset.bookBreak='true';
      group.style.setProperty('--road-color',selected.page>=segment.from.endPage?'#65a63f':segment.from.color);
      for(const className of ['road-base','road-line']) {
        const line=document.createElementNS(NS,'path');line.setAttribute('d',segment.d);line.classList.add(className);group.append(line);
      }
      svg.append(group); dots.push({segment,group,line:group.lastElementChild});
    });
    // Sample the same geometry used by the road, so page dots also cross scene boundaries.
    dots.forEach(({segment,group,line})=>{
      const length=line.getTotalLength();
      segment.pages.forEach((page,i)=>{
        const position=line.getPointAtLength(length*(i+1)/(segment.pages.length+1));
        const dot=document.createElementNS(NS,'circle'); dot.setAttribute('cx',position.x);dot.setAttribute('cy',position.y);dot.setAttribute('r','3.6');
        dot.classList.add('road-page-dot');dot.style.fill=page<=selected.page?'#65a63f':segment.from.color;
        const title=document.createElementNS(NS,'title');title.textContent='Page '+page;dot.append(title);group.append(dot);
      });
    });
  }
  const queue=()=>{if(layoutFrame!=null)cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(draw);};
  draw();
  layoutObserver=new ResizeObserver(queue);layoutObserver.observe(path);
  document.fonts?.ready.then(()=>{if(svg.isConnected)queue();});
}
function makeStep(chapter, book, index, member, targetChapter, plan) {
  const detail = {...chapter,book:book.name,slug:book.slug,id:book.slug+'-'+chapter.number};
  const landmark = LANDMARKS[detail.id], done = member.page >= chapter.endPage, current = detail.id === currentChapterId;
  const x = pattern[index % pattern.length];
  const step = document.createElement('li');
  step.id = detail.id; step.className = 'chapter-step ' + (done ? 'done' : current ? 'current' : 'upcoming') + (x >= 0 ? ' label-left' : '') + (landmark ? ' story-step' : '');
  step.style.setProperty('--node-x', x + '%');
  step.dataset.startPage = chapter.startPage; step.dataset.endPage = chapter.endPage;
  if (current) step.setAttribute('aria-current','step');
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
  layoutObserver?.disconnect();sceneryObserver?.disconnect();if(layoutFrame!=null)cancelAnimationFrame(layoutFrame);
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
      const world=WORLDS[key], region=document.createElement('div');region.className='world-section world-'+key;region.dataset.world=key;
      region.style.cssText='--world-bg:'+world.bg+';--world-accent:'+world.color+';--world-depth:'+world.depth;
      const heading=document.createElement('div');heading.className='world-caption'+(pattern[(from-1)%pattern.length]<0?' caption-right':'');
      const chapters=book.chapters.filter(ch=>ch.number>=from && ch.number<=to);
      heading.innerHTML='<h4>'+title+'</h4><span>Pages '+chapters[0].startPage+'–'+chapters.at(-1).endPage+'</span>';region.append(heading);
      const list=document.createElement('ol');list.className='chapter-list';list.setAttribute('aria-label',book.name+' chapters '+from+' to '+to);list.start=from;
      chapters.forEach(chapter=>list.append(makeStep(chapter,book,chapter.number-1,member,targetChapter,plan)));
      region.append(list);section.append(region);
    });
    const end=document.createElement('div');end.className='book-end';
    end.innerHTML=icon(completed===book.chapters.length?'check':'flag')+'<span>'+book.name+' '+(completed===book.chapters.length?'complete':'finish line · page '+book.endPage)+'</span>';section.append(end);path.append(section);
  });
  const finish=document.createElement('section');finish.className='journey-finish';finish.id='journey-finish';
  finish.innerHTML='<span class="eyebrow">CHRISTMAS DAY FINISH LINE</span><h2>Moroni 10 · Page 531</h2><p>'+(member.page>=531?'You finished the Book of Mormon!':'The final chapter of your reading journey.')+'</p>';
  path.append(finish);$('floating-current').hidden=false;setupJourneyLayout(path);observeScenery();
});
$('jump-current').addEventListener('click',jumpCurrent);
$('floating-current').addEventListener('click',jumpCurrent);
$('book-jump').addEventListener('change',event=>document.getElementById('book-'+event.target.value)?.scrollIntoView({behavior:motion(),block:'start'}));
$('close-chapter').addEventListener('click',()=>$('chapter-detail').close());
