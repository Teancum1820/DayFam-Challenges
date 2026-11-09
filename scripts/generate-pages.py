"""Generate the static HTML pages. Hosting needs no build step."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1] / "dist"
MEMBERS = [member["name"] for member in json.loads((ROOT / "progress.json").read_text(encoding="utf-8"))["members"]]
VERSION = "20261108-study-room"
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

def progress_editor():
    return '''<dialog id="progress-editor" class="progress-editor" aria-labelledby="progress-title">
      <div class="dialog-head"><h2 id="progress-title">Update reading progress</h2><button id="close-progress" class="close-button" type="button" aria-label="Close progress editor"><span data-icon="x"></span></button></div>
      <p class="progress-intro">Save your latest page for everyone to see.</p>
      <form id="progress-form">
        <label for="progress-reader">Reader</label><select id="progress-reader" name="reader" required></select>
        <label for="progress-page">Last page fully read</label><input id="progress-page" name="page" type="number" inputmode="numeric" min="0" max="531" step="1" required aria-describedby="progress-help">
        <small id="progress-help">Enter 0–531. Use 0 if you haven’t started yet.</small>
        <p id="progress-status" class="progress-status" role="status" aria-live="polite"></p>
        <div class="progress-actions"><button id="cancel-progress" class="button" type="button">Cancel</button><button id="save-progress" class="button primary" type="submit">Save progress</button></div>
      </form>
    </dialog>'''

def thought_room(base, tabs):
    return f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#204c3d"><meta name="description" content="Share a scripture and a thought from your personal study with the Christmas Challenge group."><title>Scripture Thought Chat Room · Christmas Challenge</title><link rel="icon" href="{FAVICON}" type="image/svg+xml"><link rel="stylesheet" href="{base}styles.css?v={VERSION}"><link rel="stylesheet" href="{base}thought-room.css?v={VERSION}"><script type="module" src="{base}thought-room.mjs?v={VERSION}"></script></head>
<body data-view="thoughts">
<a class="skip-link" href="#content">Skip to the thought room</a>
<header class="challenge-header room-site-header"><div><a href="{base}" class="challenge-home"><span class="room-site-title">Book of Mormon Christmas Challenge</span></a><p>Oct 6 – Dec 25, 2026</p></div></header>
<main class="container room-shell">
  {tabs}
  <section class="room-hero" aria-labelledby="room-title">
    <div class="room-hero-copy"><p class="room-kicker"><span aria-hidden="true">✦</span> THE STUDY ROOM</p><h1 id="room-title">Scripture Thought<br>Chat Room</h1><p>What stood out in your reading? Share the passage and a thought, and see what others are finding in their study.</p></div>
    <img class="room-art" src="{base}assets/story/book-of-mormon.webp" alt="" width="320" height="320" fetchpriority="high">
  </section>
  <div class="room-layout" id="content">
    <section class="room-card room-composer" aria-labelledby="compose-title">
      <p class="room-label">FROM YOUR READING</p><h2 id="compose-title">Share a thought</h2>
      <form id="thought-form" aria-describedby="room-public">
        <label for="display-name">Display name</label><input id="display-name" name="name" required maxlength="32" autocomplete="nickname" placeholder="What should we call you?">
        <label for="passage">Scripture reference</label><input id="passage" name="passage" required maxlength="80" autocomplete="off" placeholder="e.g. 1 Nephi 3:7" aria-describedby="passage-tip">
        <small id="passage-tip">A book, chapter, or verse range from any scripture.</small>
        <label for="thought">Your thought</label><textarea id="thought" name="thought" required maxlength="1000" rows="4" placeholder="What stood out to you, and why?"></textarea>
        <div class="room-form-foot"><small id="room-public">Your name and post are visible to anyone who visits.</small><span id="thought-count" aria-hidden="true">0 / 1,000</span></div>
        <button class="room-send" id="post-thought" type="submit" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Post thought</button>
        <p id="form-status" class="room-status" role="status"></p>
      </form>
    </section>
    <section class="room-card room-feed" aria-labelledby="feed-title">
      <div class="room-feed-head"><div><p class="room-label">THE CONVERSATION</p><h2 id="feed-title">Shared thoughts</h2></div><span class="room-order">Newest first</span></div>
      <div class="room-feed-body">
        <p id="feed-status" class="room-status" role="status">Loading shared thoughts…</p>
        <button id="retry-feed" class="room-secondary" type="button" hidden>Try again</button>
        <div class="room-empty" id="empty-feed" hidden><span class="room-empty-icon" aria-hidden="true">✦</span><h3>Start the conversation</h3><p>A verse that surprised you, a question, or a thought you want to remember is a good place to start.</p></div>
        <ol id="thoughts" class="thought-list" aria-label="Shared scripture thoughts"></ol>
        <button id="older-thoughts" class="room-secondary" type="button" hidden>Load older thoughts</button>
      </div>
    </section>
  </div>
  <noscript><p class="notice">Enable JavaScript to read and share thoughts.</p></noscript>
</main>
</body></html>
'''

def shell(view, member=None):
    base = "../../" if member else "../" if view in ("maps", "thoughts") else "./"
    title = f"{member}’s journey" if member else "Journey maps" if view == "maps" else "Leaderboard"
    tabs = f'''<nav class="view-tabs" aria-label="Christmas Challenge views"><a href="{base}" {'aria-current="page"' if view == "leaderboard" else ""}><span class="nav-tab-icon nav-list" aria-hidden="true"></span>Leaderboard</a><a href="{base}maps/" {'aria-current="page"' if view == "maps" or member else ""}><span class="nav-tab-icon nav-map" aria-hidden="true"></span>Journey maps</a><a href="{base}thoughts/" {'aria-current="page"' if view == "thoughts" else ""}><span class="nav-tab-icon nav-thought" aria-hidden="true"></span>Thought Room</a></nav>'''
    if view == 'thoughts':
        return thought_room(base, tabs)
    stats = '''<section class="stats" aria-label="Daily reading plan">
      <article class="stat goal-stat"><span class="stat-symbol" data-icon="target"></span><div><span class="eyebrow">TODAY’S PAGE GOAL</span><p>Page <strong id="daily-goal">—</strong></p><small id="goal-note">By the end of today</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="book-open"></span><div><span class="eyebrow">PAGES PER DAY</span><p><strong id="pages-per-day">—</strong><span class="stat-unit">pages</span></p><small id="pace-note">531 pages</small></div></article>
      <article class="stat"><span class="stat-symbol" data-icon="calendar-days"></span><div><span class="eyebrow">DAYS LEFT</span><p><strong id="days-left">—</strong><span class="stat-unit">days</span></p><small id="finish-note">Finish Dec 25</small></div></article>
    </section>'''
    if member:
        content = f'''{tabs}<div class="journey-heading"><a class="back-link" href="{base}maps/">All journey maps</a><h2>{member}’s journey</h2></div>
        <div id="content" class="journey-layout" aria-busy="true"><aside class="journey-sidebar"><div class="reader-summary" id="reader-summary"></div><div class="map-controls"><label for="book-jump">JUMP TO A BOOK</label><select id="book-jump" aria-label="Jump to a book"></select><button id="jump-current" class="button primary">My current page</button></div><div class="map-legend"><span><i class="completed-dot"></i>Read</span><span><i class="current-dot"></i>You are here</span><span><i class="upcoming-dot"></i>Still to come</span></div><p class="edition-note">Standard 531-page English edition. Chapters can share a page.</p></aside><div class="journey-path" id="journey-path"><p class="loading">Loading the reading path…</p></div></div>
        <button id="floating-current" class="button current-button" hidden><span data-icon="locate-fixed"></span>My place</button>
        <dialog id="chapter-detail" aria-labelledby="chapter-title"><div class="dialog-head"><div><span class="eyebrow" id="chapter-book"></span><h2 id="chapter-title"></h2></div><button id="close-chapter" class="close-button" aria-label="Close chapter details"><span data-icon="x"></span></button></div><p id="chapter-pages"></p><div id="chapter-story"></div><p id="chapter-status"></p><a id="chapter-read" class="button primary" target="_blank" rel="noopener noreferrer">Read this chapter</a><a id="chapter-share" class="button">Share a thought</a></dialog>'''
    else:
        board = f'''<section id="content" class="leaderboard panel" aria-labelledby="board-title" aria-busy="true"><div class="board-heading"><h2 id="board-title">The leaderboard</h2><span class="reader-total" id="reader-total">{len(MEMBERS)} readers</span></div><div class="table-head" aria-hidden="true"><span>RANK</span><span>READER</span><span>READING PROGRESS</span><span>PAGE</span><span></span></div><ol id="family-list" class="family-list"><li class="loading">Loading progress…</li></ol><div class="board-foot"><span id="updated-label"></span></div></section>''' if view == "leaderboard" else '''<section id="content" aria-label="Family journey maps" aria-busy="true"><div id="family-list" class="map-grid"><p class="loading">Loading the maps…</p></div><div class="maps-foot"><span id="updated-label"></span></div></section>'''
        content = f"{stats}{tabs}{board}"
    return f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#2c8d78"><meta name="description" content="Book of Mormon Christmas Challenge: family reading progress, daily page goals, and illustrated chapter journey maps."><title>{title} · Book of Mormon Christmas Challenge</title><link rel="icon" href="{FAVICON}" type="image/svg+xml"><link rel="stylesheet" href="{base}styles.css?v={VERSION}"><script type="module" src="{base}{'journey' if member else 'app'}.mjs?v={VERSION}"></script></head>
<body data-base="{base}" data-view="{view}"{f' data-member="{member}"' if member else ""}>
<a class="skip-link" href="#content">Skip to {'reading map' if member else 'leaderboard'}</a>
<header class="challenge-header"><div><a href="{base}" class="challenge-home"><h1>Book of Mormon<br class="title-break"> Christmas Challenge</h1></a><p id="challenge-dates">Oct 6 – Dec 25, 2026</p></div><div class="header-actions"><button id="open-progress" class="button primary update-progress-button" disabled>Update progress</button><button id="open-instructions" class="instructions-button"><span class="instructions-symbol" aria-hidden="true">?</span><span>Instructions</span></button></div></header>
<main class="container{' journey-container' if member else ''}"><div id="error-banner" class="notice error" role="alert" hidden></div>{content}<p id="save-notice" class="save-notice" role="status" aria-live="polite" hidden></p></main>{instructions(base)}{progress_editor()}<noscript><p class="notice">Please enable JavaScript to see the leaderboard and reading maps.</p></noscript>
</body></html>
'''

(ROOT / "index.html").write_text(shell("leaderboard"), encoding="utf-8")
(ROOT / "maps").mkdir(exist_ok=True)
(ROOT / "maps/index.html").write_text(shell("maps"), encoding="utf-8")
for member in MEMBERS:
    path = ROOT / "journeys" / member.lower()
    path.mkdir(parents=True, exist_ok=True)
    (path / "index.html").write_text(shell("journey", member), encoding="utf-8")
(ROOT / "thoughts").mkdir(exist_ok=True)
(ROOT / "thoughts/index.html").write_text(shell("thoughts"), encoding="utf-8")
print(f"Generated leaderboard, maps directory, thought room, and {len(MEMBERS)} journey pages.")
