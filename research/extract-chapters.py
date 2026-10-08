"""Extract chapter starts from the official English PDF's native bookmarks.

The running scripture headers distinguish a shared boundary page from a chapter
that starts on a fresh page. Only page references are retained, not scripture text.
Usage: python research/extract-chapters.py
Requires pymupdf. The source PDF is downloaded separately and ignored by Git.
"""
import json
import re
import unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://www.churchofjesuschrist.org/bc/content/shared/content/english/pdf/language-materials/34406_eng.pdf?lang=eng"
BOOK_NAMES = ["1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni", "Words of Mormon", "Mosiah", "Alma", "Helaman", "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni"]
SLUGS = ["1-ne", "2-ne", "jacob", "enos", "jarom", "omni", "w-of-m", "mosiah", "alma", "hel", "3-ne", "4-ne", "morm", "ether", "moro"]
COUNTS = [22, 33, 7, 1, 1, 1, 1, 29, 63, 16, 30, 1, 9, 15, 10]
document = pymupdf.open(ROOT / "research/book-of-mormon-english.pdf")
books = []
for level, title, pdf_page in document.get_toc():
    if level == 1 and title in BOOK_NAMES:
        i = BOOK_NAMES.index(title)
        books.append({"name": title, "slug": SLUGS[i], "startPage": pdf_page - 22, "chapters": []})
        if COUNTS[i] == 1:
            books[-1]["chapters"].append({"number": 1, "startPage": pdf_page - 22})
    elif level == 2 and books and re.fullmatch(r"Chapter \d+", title):
        books[-1]["chapters"].append({"number": int(title.split()[-1]), "startPage": pdf_page - 22})

def normalize(text):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", text)).strip()

def header_contains(page_number, book_name, chapter_number):
    page = document[page_number + 21]
    text = normalize(page.get_text(clip=pymupdf.Rect(0, 0, page.rect.width, 54)))
    # Running headers have a starting reference and an optional ending chapter.
    names = "|".join(re.escape(name) for name in sorted(BOOK_NAMES, key=len, reverse=True))
    first = re.search(rf"({names})\s+(\d+)\s*:", text)
    if not first:
        return False
    start_book, start_chapter = first[1], int(first[2])
    end = re.search(rf"[–—-]\s*(?:({names})\s+)?(\d+)\s*:", text)
    end_book = (end[1] or start_book) if end else start_book
    end_chapter = int(end[2]) if end else start_chapter
    key = (BOOK_NAMES.index(book_name), chapter_number)
    return (BOOK_NAMES.index(start_book), start_chapter) <= key <= (BOOK_NAMES.index(end_book), end_chapter)

flat = [(book, chapter) for book in books for chapter in book["chapters"]]
for i, (book, chapter) in enumerate(flat):
    if i == len(flat) - 1:
        chapter["endPage"] = 531
    else:
        next_page = flat[i + 1][1]["startPage"]
        chapter["endPage"] = max(chapter["startPage"], next_page if header_contains(next_page, book["name"], chapter["number"]) else next_page - 1)
for book, expected in zip(books, COUNTS):
    assert len(book["chapters"]) == expected, book["name"]
    assert [chapter["number"] for chapter in book["chapters"]] == list(range(1, expected + 1))
    book["endPage"] = book["chapters"][-1]["endPage"]
assert len(flat) == 239
payload = {"edition": "English, 2013 standard 531-page edition", "source": SOURCE,
           "note": "Printed pages, not PDF page numbers. Adjacent chapters and books can share a page. Chapter completion requires its last printed page to be finished.", "books": books}
(ROOT / "dist/chapters.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(books)} books and {len(flat)} chapters.")
print(json.dumps(books[0]["chapters"][:16]))
