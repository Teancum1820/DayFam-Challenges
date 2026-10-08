"""Optimize generated artwork for the static site, preserving transparency.

Source manifest: .test-output/art-sources.json (local, ignored).
Requires Pillow. Originals remain in the Codex image library.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'dist/assets/story'
DEST.mkdir(parents=True, exist_ok=True)
for item in json.loads((ROOT / '.test-output/art-sources.json').read_text(encoding='utf-8-sig')):
    if (DEST / f"{item['name']}.webp").exists():
        continue
    image = Image.open(item['path'])
    is_world = item['name'].startswith('world-')
    image.thumbnail((1400, 1400) if is_world else (640, 640), Image.Resampling.LANCZOS)
    image.save(DEST / f"{item['name']}.webp", 'WEBP', quality=86, method=6)
    print(item['name'], image.size, image.mode)
