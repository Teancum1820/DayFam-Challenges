"""Regenerate the static page shells. No build is required for hosting."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dist"
MEMBERS = ["Caleb", "Katelyn", "Elizabeth", "Benjamin", "Aaron", "Lydia"]
FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%237b4bc7'/%3E%3Cpath d='M8 11q6-3 12 1 6-4 12-1v19q-6-3-12 0-6-3-12 0z' fill='%23fff'/%3E%3Cpath d='M20 12v18' stroke='%237b4bc7' stroke-width='2'/%3E%3C/svg%3E"

def shell(view, member=None):
    base = "../../" if member else "../" if view == "maps" else "./"
    title = f"{member}’s journey" if member else "Journey maps" if view == "maps" else "Family leaderboard"
    stats = '''<section class="stats" aria-label="Daily reading plan">
      <article class="stat goal-stat"><span class="stat-symbol" data-icon="target"></span><div><span class="eyebrow">TODAY’S PAGE GOAL</span><p>Page <strong id="daily-goal">—</strong></p><small id="goal-note">By the end of today</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="book-open"></span><div><span class="eyebrow">PAGES PER DAY</span><p><strong id="pages-per-day">—</strong><span class="stat-unit">pages</span></p><small id="pace-note">A little reading, every day</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="calendar-days"></span><div><span class="eyebrow">DAYS LEFT</span><p><strong id="days-left">—</strong><span class="stat-unit">days</span></p><small id="finish-note">A Christmas Day finish</small></div></article>
    </section>'''
    if member:
        content = f'''<a class="back-link" href="../../maps/"><span data-icon="chevron-left"></span>All journey maps</a>
    <div class="journey-heading"><div><span class="eyebrow">ONE CHAPTER AT A TIME</span><h1>{member}’s reading journey<span class="title-dot">.</span></h1><p>From 1 Nephi to Moroni. Your whole story, one step at a time.</p></div></div>
    <div id="content" class="journey-layout" aria-busy="true"><aside class="journey-sidebar"><div class="reader-summary" id="reader-summary"></div><div class="map-controls"><label for="book-jump">JUMP TO A BOOK</label><select id="book-jump" aria-label="Jump to a book"></select><button id="jump-current" class="button primary">My current page</button></div><div class="map-legend"><span><i class="completed-dot"></i>Read</span><span><i class="current-dot"></i>You are here</span><span><i class="upcoming-dot"></i>Still to come</span></div><p class="edition-note">Page numbers follow the standard 531-page English edition. Chapters can share a page.</p></aside><div class="journey-path" id="journey-path"><p class="loading">Loading the reading path…</p></div></div>
    <button id="floating-current" class="button current-button" hidden><span data-icon="locate-fixed"></span>My place</button>
    <dialog id="chapter-detail" aria-labelledby="chapter-title"><div class="dialog-head"><div><span class="eyebrow" id="chapter-book"></span><h2 id="chapter-title"></h2></div><button id="close-chapter" class="close-button" aria-label="Close chapter details"><span data-icon="x"></span></button></div><p id="chapter-pages"></p><p id="chapter-status"></p><a id="chapter-read" class="button primary" target="_blank" rel="noopener noreferrer">Read this chapter</a></dialog>'''
    else:
        heading = "The family reading race" if view == "leaderboard" else "Six readers. Six adventures"
        subtitle = "Book of Mormon Christmas Challenge" if view == "leaderboard" else "Choose a reader. Follow the path. See what’s ahead."
        tabs = f'''<nav class="view-tabs" aria-label="Leaderboard views"><a href="{base}" {'aria-current="page"' if view == 'leaderboard' else ''}><span data-icon="list-ordered"></span>Leaderboard</a><a href="{base}maps/" {'aria-current="page"' if view == 'maps' else ''}><span data-icon="map"></span>Journey maps</a></nav>'''
        board = '''<section id="content" class="leaderboard panel" aria-labelledby="board-title" aria-busy="true"><div class="board-heading"><div><span class="eyebrow">THE DAY FAMILY</span><h2 id="board-title">The leaderboard</h2></div><span class="reader-total">6 readers</span></div><div class="table-head" aria-hidden="true"><span>RANK</span><span>READER</span><span>THE READING JOURNEY</span><span>PAGE</span><span></span></div><ol id="family-list" class="family-list"><li class="loading">Getting the family together…</li></ol><div class="board-foot"><span id="leaderboard-note"></span><span id="updated-label"></span></div></section>''' if view == "leaderboard" else '''<section id="content" aria-label="Family journey maps" aria-busy="true"><div id="family-list" class="map-grid"><p class="loading">Loading the family’s maps…</p></div><div class="maps-foot"><span id="leaderboard-note"></span><span id="updated-label"></span></div></section>'''
        content = f'''<div class="page-heading"><span class="eyebrow">READ A LITTLE. GROW TOGETHER.</span><h1>{heading}<span class="title-dot">.</span></h1><p>{subtitle}</p></div>{stats}{tabs}{board}'''
    return f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#7b4bc7"><meta name="description" content="Follow the Day family’s Book of Mormon reading challenge with a simple leaderboard and a chapter-by-chapter reading journey for every person."><title>{title} · DayFam Challenges</title><link rel="icon" href="{FAVICON}" type="image/svg+xml"><link rel="stylesheet" href="{base}styles.css?v=20261008"><script type="module" src="{base}{'journey' if member else 'app'}.mjs?v=20261008"></script></head>
<body data-base="{base}" data-view="{view}"{f' data-member="{member}"' if member else ''}>
  <a class="skip-link" href="#content">Skip to {'reading map' if member else 'leaderboard'}</a>
  <header class="site-header"><a href="{base}" class="brand" aria-label="DayFam Challenges home"><span class="brand-symbol" data-icon="book-open"></span><span>dayfam<small>CHALLENGES</small></span></a><span class="header-challenge">THE CHRISTMAS CHALLENGE<span id="challenge-dates">Oct 6 – Dec 25, 2026</span></span><a class="header-map" href="{base}{'' if member else 'maps/'}"><span data-icon="{'trophy' if member else 'map'}"></span><span>{'Leaderboard' if member else 'Explore the maps'}</span></a></header>
  <main class="container{' journey-container' if member else ''}"><div id="error-banner" class="notice error" role="alert" hidden></div><div id="preview-banner" class="notice" hidden><span>Local preview — the shared leaderboard has not changed.</span><button id="return-shared" class="text-button">Return to shared progress</button></div>{content}
  <footer class="site-footer"><span>One book. One family. Every page counts.</span><button id="edit-progress" class="text-button" disabled>Update progress</button></footer></main><div id="toast" class="toast" role="status" hidden></div><noscript><p class="notice">Please enable JavaScript to see the leaderboard and reading maps.</p></noscript>
</body></html>
'''

(ROOT / "index.html").write_text(shell("leaderboard"), encoding="utf-8")
(ROOT / "maps").mkdir(exist_ok=True)
(ROOT / "maps" / "index.html").write_text(shell("maps"), encoding="utf-8")
(ROOT / "journeys").mkdir(exist_ok=True)
for member in MEMBERS:
    (ROOT / "journeys" / member.lower()).mkdir(exist_ok=True)
    (ROOT / "journeys" / member.lower() / "index.html").write_text(shell("journey", member), encoding="utf-8")
print("Generated leaderboard, maps directory, and six individual journey pages.")
