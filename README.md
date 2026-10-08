# DayFam Challenges

A static Book of Mormon reading challenge for Caleb, Katelyn, Elizabeth, Benjamin, Aaron, and Lydia.

**Live site:** https://Teancum1820.github.io/DayFam-Challenges/

## Two ways to follow along

- **Leaderboard:** readers sorted by their last completed page, with today's page goal, pages per day, and days left. Tied readers share a rank; readers at page 0 have not started.
- **Journey maps:** a second ranked view links to each person's own long, illustrated reading path. Raised chapter circles, small page dots, book banners, and a current-place marker show the whole journey from 1 Nephi to Moroni 10. Book navigation and a “My place” button make the long paths easy to use.

The header is **Book of Mormon Christmas Challenge**. Its **Instructions** popup explains a two-color marking system: red for Deity and blue for gospel actions, with examples and a phrase showing both colors. Readers can choose their own two colors.

Caleb is on page 30 with green accents, and Katelyn is on page 7 with orange accents. Both have profile photos. The other four readers remain at 0 until their progress is supplied. Initial avatars can be replaced with family photos.

## The Christmas reading plan

October 6–December 25, 2026 includes **81 reading days**. Reading the standard 531-page English edition takes **6.56 pages per day**, or about 6–7 pages daily. The daily target is rounded up: by the end of October 8, the target is page 20. Both endpoints count as reading days. Targets use America/Denver and refresh when the day changes.

Progress records the **last page fully read**. A chapter is complete once its final printed page is fully read. The current marker points to the first chapter with pages still ahead. For example, page 30 completes 14 chapters and puts Caleb in 1 Nephi 15 (pages 30–33).

## Update the family’s progress

1. Edit [dist/progress.json](dist/progress.json), changing each member’s `page` to their last fully read page.
2. Set `updatedAt` to the update time in ISO format and commit to `main`. You can also ask Codex to make the update and push it.
3. GitHub Actions checks the data and reading calculations, then publishes the update. The shared site refreshes its data every five minutes and when a tab becomes visible; a page refresh also loads the latest deployment.

There is no progress-editing button on the public site. No passwords, GitHub tokens, or private write credentials are stored in it.

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

HTML asset links and module imports carry a release version to refresh cached code after design updates. When changing the interface again, bump that version in the page generator and module imports, then regenerate the HTML.

## Hosting

GitHub Pages uses `.github/workflows/pages.yml` to publish `dist` on every push to `main`. In repository Settings → Pages, the publishing source is **GitHub Actions**.

For a future Cloudflare Pages migration: connect this repository, select no framework, leave the build command empty, and set the output directory to `dist`. All URLs are relative, so the same files work on either host. There is no backend, database, package installation, or framework dependency.

## Design assets

The vertical paths take inspiration from [Duolingo's explanation of its home-screen design](https://blog.duolingo.com/new-duolingo-home-screen-design/), with original colors, typography, layout, and commissioned game-style imagery. No Duolingo artwork is used.

**44 original generated illustrations** are saved as optimized WebP files in [dist/assets/story](dist/assets/story). The built-in image-generation tool produced fourteen environments and thirty transparent landmarks/characters. The complete prompt set is [research/art-prompts.json](research/art-prompts.json); the latest six environments and ten landmarks are documented in [research/expansion-prompts.json](research/expansion-prompts.json). Local original-image paths are kept in an ignored manifest; `scripts/prepare-art.py` creates the web assets with Pillow and preserves alpha transparency. The final scenery and landmarks total about 3.8 MB. Backgrounds and offscreen illustrations load as the reader approaches them.

[dist/story.mjs](dist/story.mjs) places 46 story landmarks and assigns a setting to every chapter. Fourteen environments include Jerusalem, wilderness, Bountiful's shipyard, sea, promised-land jungle, forests, hills, the Waters of Mormon, Zarahemla, fortified cities, a mountain, temple, destruction, and final-record wilderness. These are imaginative narrative settings, not a reconstruction of ancient geography. Characters and objects are original rounded, isometric-inspired storybook art.

Scenery layers overlap with feathered masks and shared transition colors. Repeated background tiles fade at their edges. A separate SVG road connects all 239 chapters with 238 continuous segments, including 14 bridges around book headings. Chapter circles, road endpoints, scenery, and page dots realign when the screen size changes. The path regression test covers desktop and phone widths, scenery changes, book breaks, and shared printed pages.

Landmark research follows the official scripture chapters, including [Nephi obtaining the brass plates](https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/4?lang=eng), [Lehi’s tree of life](https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/8?lang=eng), [the Liahona](https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/16?lang=eng), [the sea crossing](https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/18?lang=eng), [the destruction](https://www.churchofjesuschrist.org/study/scriptures/bofm/3-ne/8?lang=eng), [the Savior’s visit](https://www.churchofjesuschrist.org/study/scriptures/bofm/3-ne/11?lang=eng), and [Moroni’s final invitation](https://www.churchofjesuschrist.org/study/scriptures/bofm/moro/10?lang=eng). Every chapter dialog links to its corresponding official text.

UI icons are self-hosted SVGs downloaded from `lucide-static` 1.53.0; see `dist/assets/icons/LICENSE` and `version.json`.

Additional landmarks follow [the iron rod](https://www.churchofjesuschrist.org/study/scriptures/bofm/1-ne/15?lang=eng), [Abinadi's teaching](https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/13?lang=eng), [Alma's conversion](https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/27?lang=eng), [the buried weapons](https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/24?lang=eng), [the young warriors](https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/53?lang=eng), [Nephi and Lehi protected by fire](https://www.churchofjesuschrist.org/study/scriptures/bofm/hel/5?lang=eng), [Christ blessing the children](https://www.churchofjesuschrist.org/study/scriptures/bofm/3-ne/17?lang=eng), and [Mormon preserving the records](https://www.churchofjesuschrist.org/study/scriptures/bofm/morm/6?lang=eng).

Outfit is self-hosted under the SIL Open Font License (see `dist/assets/OFL.txt`). The interface supports keyboard navigation, semantic dialogs, mobile layouts, and reduced-motion preferences.
