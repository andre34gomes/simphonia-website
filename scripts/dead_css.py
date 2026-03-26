"""
Find CSS class selectors that are never referenced in any HTML or JS source file.
Usage: python3 scripts/dead_css.py
"""
import re, glob, sys

all_src = ""
for f in (glob.glob("*.html") + glob.glob("pages/*.html") +
          glob.glob("js/*.js") + glob.glob("js/components/*.js")):
    try:
        all_src += open(f).read()
    except OSError:
        pass

css_files = [
    "css/support.css",
    "css/how-it-works.css",
    "css/home.css",
    "css/about.css",
    "css/destinations.css",
    "css/legal.css",
    "css/base.css",
]

total_dead = 0
for path in css_files:
    try:
        css_text = open(path).read()
    except OSError:
        continue
    classes = sorted(set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]+)', css_text)))
    dead = [c for c in classes if c not in all_src]
    total_dead += len(dead)
    print(f"\n{path}  ({len(dead)} dead / {len(classes)} total)")
    for c in dead:
        print(f"  .{c}")

print(f"\n--- Total dead classes: {total_dead} ---")

