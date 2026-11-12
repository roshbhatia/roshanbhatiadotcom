#!/usr/bin/env bash
# Assembles the static site for GitHub Pages from prototypes/ into an output directory (default _site).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
source_dir="$root/prototypes"
meta_dir="$source_dir/site-meta"
output_dir="${1:-$root/_site}"

rm -rf "$output_dir"
mkdir -p "$output_dir"

cp "$source_dir/desk.js" "$output_dir/"
cp -R "$source_dir/desk" "$source_dir/shared" "$source_dir/assets" "$source_dir/writing" "$output_dir/"
for file in favicon.svg favicon.ico apple-touch-icon.png icon-192.png icon-512.png robots.txt sitemap.xml site.webmanifest 404.html og-image.png; do
  if [[ -f "$meta_dir/$file" ]]; then cp "$meta_dir/$file" "$output_dir/"; else echo "build-site: skipping missing $file" >&2; fi
done
echo "roshanbhatia.com" > "$output_dir/CNAME"
# Evicts the old site's Workbox service worker for returning visitors; it must stay at /sw.js.
cp "$root/public/sw.js" "$output_dir/sw.js"

python3 - "$source_dir/desk.html" "$meta_dir/head.html" "$meta_dir/body.html" "$output_dir/index.html" <<'PYTHON'
import re
import sys

page_path, head_path, body_path, output_path = sys.argv[1:]
page = open(page_path, encoding="utf-8").read()
head = open(head_path, encoding="utf-8").read()
body = open(body_path, encoding="utf-8").read()

page, title_count = re.subn(r"<title>.*?</title>", "<title>roshan bhatia</title>", page, count=1, flags=re.S)
page, head_count = re.subn(r"</head>", head + "  </head>", page, count=1)
page, body_count = re.subn(r"<body([^>]*)>", lambda match: match.group(0) + "\n" + body, page, count=1)
if (title_count, head_count, body_count) != (1, 1, 1):
    sys.exit(f"build-site: could not inject into desk.html (title={title_count}, head={head_count}, body={body_count})")
open(output_path, "w", encoding="utf-8").write(page)
PYTHON

echo "build-site: wrote $output_dir ($(du -sh "$output_dir" | cut -f1))"
