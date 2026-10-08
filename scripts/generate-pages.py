"""Generate the eight static HTML pages. Hosting needs no build step."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dist"
MEMBERS = ["Caleb", "Katelyn", "Elizabeth", "Benjamin", "Aaron", "Lydia"]
VERSION = "20261008-expanded"
FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%232c8d78'/%3E%3Cpath d='M8 11q6-3 12 1 6-4 12-1v19q-6-3-12 0-6-3-12 0z' fill='%23fff'/%3E%3C/svg%3E"

def instructions(base):
    return f'''<dialog id="instructions" class="instructions-dialog" aria-labelledby="instructions-title">
      <div class="dialog-head"><h2 id="instructions-title">Your two-color reading guide</h2><button id="close-instructions" class="close-button" aria-label="Close instructions"><span data-icon="x"></span></button></div>
      <p class="instructions-intro">As you read, mark up your Book of Mormon with two colors. Choose any two you like, and keep the same key throughout the book.</p>
      <section class="marking-card deity-card"><span class="color-swatch" aria-hidden="true"></span><div><span class="color-key">COLOR 1 · RED</span><h3>Deity</h3><p>Mark references to God the Father, Jesus Christ, and the Holy Ghost, including Their names and titles.</p><div class="marking-examples"><span>God</span><span>Jesus Christ</span><span>Holy Ghost</span><span>Lord</span><span>Savior</span><span>Redeemer</span></div></div></section>
      <section class="marking-card gospel-card"><span class="color-swatch" aria-hidden="true"></span><div><span class="color-key">COLOR 2 · BLUE</span><h3>The gospel of Jesus Christ</h3><p>Mark what God asks us to do to follow Him.</p><div class="marking-examples"><span>Faith</span><span>Repentance</span><span>Baptism</span><span>Receiving the Holy Ghost</span><span>Enduring to the end</span><span>Prayer</span><span>Church</span><span>Keeping commandments</span><span>Serving others</span></div></div></section>
      <div class="marking-example"><h3>When both appear together</h3><p>In a phrase like <strong>“have faith in Jesus Christ,”</strong> mark <mark class="gospel-mark">have faith</mark> in your gospel color and <mark class="deity-mark">Jesus Christ</mark> in your Deity color.</p></div>
      <p class="instructions-note">Read to the daily page goal, then use the leaderboard and your journey map to follow your progress.</p><button id="done-instructions" class="button primary full">Got it</button>
    </dialog>'''

def shell(view, member=None):
    base = "../../" if member else "../" if view == "maps" else "./"
    title = f"{member}’s journey" if member else "Journey maps" if view == "maps" else "Leaderboard"
    tabs = f'''<nav class="view-tabs" aria-label="Leaderboard views"><a href="{base}" {'aria-current="page"' if view == "leaderboard" else ""}><span data-icon="list-ordered"></span>Leaderboard</a><a href="{base}maps/" {'aria-current="page"' if view == "maps" or member else ""}><span data-icon="map"></span>Journey maps</a></nav>'''
    stats = '''<section class="stats" aria-label="Daily reading plan">
      <article class="stat goal-stat"><span class="stat-symbol" data-icon="target"></span><div><span class="eyebrow">TODAY’S PAGE GOAL</span><p>Page <strong id="daily-goal">—</strong></p><small id="goal-note">By the end of today</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="book-open"></span><div><span class="eyebrow">PAGES PER DAY</span><p><strong id="pages-per-day">—</strong><span class="stat-unit">pages</span></p><small id="pace-note">531 pages</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="calendar-days"></span><div><span class="eyebrow">DAYS LEFT</span><p><strong id="days-left">—</strong><span class="stat-unit">days</span></p><small id="finish-note">Finish Dec 25</small></div></article>
    </section>'''
    if member:
        content = f'''{tabs}<div class="journey-heading"><a class="back-link" href="{base}maps/">All journey maps</a><h2>{member}’s journey</h2></div>
        <div id="content" class="journey-layout" aria-busy="true"><aside class="journey-sidebar"><div class="reader-summary" id="reader-summary"></div><div class="map-controls"><label for="book-jump">JUMP TO A BOOK</label><select id="book-jump" aria-label="Jump to a book"></select><button id="jump-current" class="button primary">My current page</button></div><div class="map-legend"><span><i class="completed-dot"></i>Read</span><span><i class="current-dot"></i>You are here</span><span><i class="upcoming-dot"></i>Still to come</span></div><p class="edition-note">Standard 531-page English edition. Chapters can share a page.</p></aside><div class="journey-path" id="journey-path"><p class="loading">Loading the reading path…</p></div></div>
        <button id="floating-current" class="button current-button" hidden><span data-icon="locate-fixed"></span>My place</button>
        <dialog id="chapter-detail" aria-labelledby="chapter-title"><div class="dialog-head"><div><span class="eyebrow" id="chapter-book"></span><h2 id="chapter-title"></h2></div><button id="close-chapter" class="close-button" aria-label="Close chapter details"><span data-icon="x"></span></button></div><p id="chapter-pages"></p><div id="chapter-story"></div><p id="chapter-status"></p><a id="chapter-read" class="button primary" target="_blank" rel="noopener noreferrer">Read this chapter</a></dialog>'''
    else:
        board = '''<section id="content" class="leaderboard panel" aria-labelledby="board-title" aria-busy="true"><div class="board-heading"><h2 id="board-title">The leaderboard</h2><span class="reader-total">6 readers</span></div><div class="table-head" aria-hidden="true"><span>RANK</span><span>READER</span><span>READING PROGRESS</span><span>PAGE</span><span></span></div><ol id="family-list" class="family-list"><li class="loading">Loading progress…</li></ol><div class="board-foot"><span id="updated-label"></span></div></section>''' if view == "leaderboard" else '''<section id="content" aria-label="Family journey maps" aria-busy="true"><div id="family-list" class="map-grid"><p class="loading">Loading the maps…</p></div><div class="maps-foot"><span id="updated-label"></span></div></section>'''
        content = f"{stats}{tabs}{board}"
    return f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2c8d78"><meta name="description" content="Book of Mormon Christmas Challenge: family reading progress, daily page goals, and illustrated chapter journey maps."><title>{title} · Book of Mormon Christmas Challenge</title><link rel="icon" href="{FAVICON}" type="image/svg+xml"><link rel="stylesheet" href="{base}styles.css?v={VERSION}"><script type="module" src="{base}{'journey' if member else 'app'}.mjs?v={VERSION}"></script></head>
<body data-base="{base}" data-view="{view}"{f' data-member="{member}"' if member else ""}>
<a class="skip-link" href="#content">Skip to {'reading map' if member else 'leaderboard'}</a>
<header class="challenge-header"><div><a href="{base}" class="challenge-home"><h1>Book of Mormon<br class="title-break"> Christmas Challenge</h1></a><p id="challenge-dates">Oct 6 – Dec 25, 2026</p></div><button id="open-instructions" class="instructions-button"><span class="instructions-symbol" aria-hidden="true">?</span><span>Instructions</span></button></header>
<main class="container{' journey-container' if member else ''}"><div id="error-banner" class="notice error" role="alert" hidden></div>{content}</main>{instructions(base)}<noscript><p class="notice">Please enable JavaScript to see the leaderboard and reading maps.</p></noscript>
</body></html>
'''

(ROOT / "index.html").write_text(shell("leaderboard"), encoding="utf-8")
(ROOT / "maps").mkdir(exist_ok=True)
(ROOT / "maps/index.html").write_text(shell("maps"), encoding="utf-8")
for member in MEMBERS:
    path = ROOT / "journeys" / member.lower()
    path.mkdir(parents=True, exist_ok=True)
    (path / "index.html").write_text(shell("journey", member), encoding="utf-8")
print("Generated leaderboard, maps directory, and six journey pages.")
