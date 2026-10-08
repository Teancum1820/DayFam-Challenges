# DayFam Challenges

A playful, static Book of Mormon reading leaderboard for Caleb, Caitlin, Elizabeth, Benjamin, Aaron, and Lydia.

**Live site:** https://Teancum1820.github.io/DayFam-Challenges/

## The Christmas reading plan

October 6–December 25, 2026 includes **81 reading days**. Reading the standard 531-page English edition takes **6.56 pages per day**, or about 6–7 pages daily. The daily target is rounded up: by the end of October 8, the target is page 20. Both endpoints count as reading days. Targets use America/Denver and refresh when the day changes.

The page counts record the **last page fully read**, with 0 meaning not started. Everyone starts at 0; demo progress is clearly labeled and never saved. Rankings use shared ranks for ties. By-page tracks are proportional to page counts; by-book tracks give each book equal space and interpolate the page position within that book. Small bubbles are 10-page checkpoints, not chapter completion. Book milestones use the [official English edition's table of contents](https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf?lang=eng).

## Update the family’s progress

1. On the site, choose **Update progress** and enter each reader’s last completed page.
2. Choose **Preview these updates**. This changes the current tab only.
3. Copy the generated data or download `progress.json`.
4. Follow the editor’s GitHub link to `dist/progress.json`, replace the entire file, and commit to `main`. You must be signed into GitHub with repository write access.
5. The included GitHub Actions workflow checks the data and reading calculations, then publishes the update. The shared site refreshes its data every five minutes and when a tab becomes visible; a page refresh also loads the latest deployment.

You can also ask Codex to update `dist/progress.json` and push a commit. No passwords, GitHub tokens, or private write credentials are stored in the site. The editor is a preview/export tool, not an authenticated publishing interface.

## Add family photos

Save square photos in `dist/assets/` and set each member’s `avatar`, for example `"avatar": "assets/caleb.webp"`. Initial avatars remain the fallback if an image cannot load. This is a public repository and public website, so added photos are public too.

## Change the dates or edition

Edit `challenge.startDate`, `challenge.endDate`, `challenge.totalPages`, and optionally `challenge.timeZone` in `dist/progress.json`. The calculator lets visitors experiment without changing the shared challenge. Book locations correspond to the 531-page English edition; the book view is disabled for other page totals.

## Run locally

No install or build step is required. Serve the `dist` directory with any static HTTP server, for example:

```powershell
python -m http.server 4173 --directory dist
```

Open http://localhost:4173. Use an HTTP server rather than opening the HTML file directly, because browsers restrict loading JSON through `file:` URLs.

Run checks with Node.js 20 or newer:

```powershell
node --test tests/core.test.mjs
```

## Hosting

GitHub Pages uses `.github/workflows/pages.yml` to publish `dist` on every push to `main`. In repository Settings → Pages, the publishing source is **GitHub Actions**.

For a future Cloudflare Pages migration: connect this repository, select no framework, leave the build command empty, and set the output directory to `dist`. All URLs are relative, so the same files work on either host. There is no backend, database, package installation, or framework dependency.

## Design assets

The book illustration was generated using the built-in imagegen tool, with this prompt: “A charming premium 3D clay-style open cream book with a deep plum cover, coral-red ribbon bookmark, and tiny warm golden star accents; soft warm studio lighting and shadows; centered three-quarter perspective; generous margin on solid light lilac #eee7f8; no text, people, UI, or watermark.” The optimized asset is `dist/assets/reading-book.webp`.

Outfit is self-hosted under the SIL Open Font License (see `dist/assets/OFL.txt`). The interface supports keyboard navigation, semantic dialogs, mobile layouts, and reduced-motion preferences.
