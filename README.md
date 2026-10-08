# DayFam Challenges

A static Book of Mormon reading challenge for Caleb, Katelyn, Elizabeth, Benjamin, Aaron, and Lydia.

**Live site:** https://Teancum1820.github.io/DayFam-Challenges/

## Two ways to follow along

- **Leaderboard:** readers sorted by their last completed page, with today's page goal, pages per day, and days left. Tied readers share a rank; readers at page 0 have not started.
- **Journey maps:** a second ranked view links to each person's own long, vertical reading path. Raised chapter circles, small page dots, book banners, and a current-place marker show the whole journey from 1 Nephi to Moroni 10. Book navigation and a “My place” button make the long paths easy to use.

Caleb starts at page 30. The other five readers remain at 0 until their progress is supplied. Initial avatars can be replaced with family photos.

## The Christmas reading plan

October 6–December 25, 2026 includes **81 reading days**. Reading the standard 531-page English edition takes **6.56 pages per day**, or about 6–7 pages daily. The daily target is rounded up: by the end of October 8, the target is page 20. Both endpoints count as reading days. Targets use America/Denver and refresh when the day changes.

Progress records the **last page fully read**. A chapter is complete once its final printed page is fully read. The current marker points to the first chapter with pages still ahead. For example, page 30 completes 14 chapters and puts Caleb in 1 Nephi 15 (pages 30–33).

## Update the family’s progress

1. On the site, choose **Update progress** and enter each reader’s last completed page.
2. Choose **Preview updates**. This changes the current tab only.
3. Copy the generated data or download `progress.json`.
4. Follow the editor’s GitHub link to `dist/progress.json`, replace the entire file, and commit to `main`. You must be signed into GitHub with repository write access.
5. The included GitHub Actions workflow checks the data and reading calculations, then publishes the update. The shared site refreshes its data every five minutes and when a tab becomes visible; a page refresh also loads the latest deployment.

You can also ask Codex to update `dist/progress.json` and push a commit. No passwords, GitHub tokens, or private write credentials are stored in the site. The editor is a preview/export tool, not an authenticated publishing interface.

## Add family photos

Save square photos in `dist/assets/` and set each member’s `avatar`, for example `"avatar": "assets/caleb.webp"`. Initial avatars remain the fallback if an image cannot load. This is a public repository and public website, so added photos are public too.

## Change the dates or edition

Edit `challenge.startDate`, `challenge.endDate`, `challenge.totalPages`, and optionally `challenge.timeZone` in `dist/progress.json`. Changing `totalPages` updates the leaderboard and pace; chapter maps require the standard 531-page edition.

## Chapter references

`dist/chapters.json` contains all **15 books and 239 chapters**, with printed page ranges extracted from the [official English Book of Mormon PDF](https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf?lang=eng). Chapters and books sometimes share a printed page. Chapter dialogs link to the corresponding official scripture text. PDF bookmarks and running headers preserve those shared-page boundaries.

The reproducible extraction script is `research/extract-chapters.py`. Download the linked PDF as `research/book-of-mormon-english.pdf` and run the script with Python and PyMuPDF installed. The PDF is ignored by Git; scripture text is not bundled in the website.

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

The eight HTML pages are checked in. After editing their shared template, regenerate them with:

```powershell
python scripts/generate-pages.py
```

## Hosting

GitHub Pages uses `.github/workflows/pages.yml` to publish `dist` on every push to `main`. In repository Settings → Pages, the publishing source is **GitHub Actions**.

For a future Cloudflare Pages migration: connect this repository, select no framework, leave the build command empty, and set the output directory to `dist`. All URLs are relative, so the same files work on either host. There is no backend, database, package installation, or framework dependency.

## Design assets

The vertical paths take inspiration from [Duolingo's explanation of its home-screen design](https://blog.duolingo.com/new-duolingo-home-screen-design/), with original DayFam colors, typography, and layout. No Duolingo artwork is used. Icons are self-hosted SVGs downloaded from `lucide-static` 1.53.0; see `dist/assets/icons/LICENSE` and `version.json`.

Outfit is self-hosted under the SIL Open Font License (see `dist/assets/OFL.txt`). The interface supports keyboard navigation, semantic dialogs, mobile layouts, and reduced-motion preferences.
