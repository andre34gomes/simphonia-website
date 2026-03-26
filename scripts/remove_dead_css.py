"""
Remove confirmed dead CSS blocks.
Run from the project root: python3 scripts/remove_dead_css.py
"""
import re


def remove_block(text, start_pat, end_pat, label=''):
    """Remove text from the start of start_pat's line up to (not including) end_pat's line."""
    m_start = re.search(start_pat, text)
    m_end   = re.search(end_pat,   text)
    if not m_start:
        print(f'  SKIP (start not found): {label or start_pat!r}')
        return text, 0
    if not m_end:
        print(f'  SKIP (end not found): {label or end_pat!r}')
        return text, 0
    if m_end.start() <= m_start.start():
        print(f'  SKIP (end before start): {label or start_pat!r}')
        return text, 0
    line_start = text.rfind('\n', 0, m_start.start()) + 1
    line_end   = text.rfind('\n', 0, m_end.start()) + 1
    removed = text[line_start:line_end].count('\n')
    print(f'  -{removed} lines: {label or start_pat!r}')
    return text[:line_start] + text[line_end:], removed


# ── about.css ────────────────────────────────────────────────────────────────
print('\n=== about.css ===')
text = open('css/about.css').read()
orig = text.count('\n')

# The origin-block section was partially replaced; remove whatever remains
text, _ = remove_block(text,
    r'\.origin-block(?:__|\b)',
    r'/\* Values \*/',
    'origin-block (remaining)')

# The leading comment that precedes Values section is already there; clean up blank lines
text = re.sub(r'\n{3,}', '\n\n', text)
open('css/about.css', 'w').write(text)
print(f'  about.css: {orig} → {text.count(chr(10))} lines')


# ── home.css ──────────────────────────────────────────────────────────────────
print('\n=== home.css ===')
text = open('css/home.css').read()
orig = text.count('\n')
total_removed = 0

BLOCKS = [
    # adl-* (app dashboard landscape — never implemented)
    (r'\.adl-add-btn\b', r'(?:\.app-download|\.app-ui|\.store-badge|\.dest-scroller|\.marquee-strip|\.metric-unit|/\* Showcase)',
     'adl-* block'),

    # app-download-* (old download section)
    (r'\.app-download-section\b', r'(?:\.app-ui\b|\.store-badge\b|\.dest-scroller\b|\.marquee-strip\b|/\* Showcase)',
     'app-download-* block'),

    # app-ui__* (old UI mock, replaced by sas-*)
    (r'\.app-ui\b', r'(?:\.store-badge\b|\.dest-scroller\b|\.marquee-strip\b|/\* Showcase)',
     'app-ui__* block'),

    # store-badge (replaced by hero-dl-btn)
    (r'\.store-badge\b', r'(?:\.marquee-strip\b|\.metric-unit\b|\.phone-screen-glow\b|/\* Showcase)',
     'store-badge block'),

    # marquee-strip alias (dead; .marquee-track is used)
    (r'\.marquee-strip\s*\{', r'(?:\.metric-unit\b|\.phone-screen-glow\b|/\* Showcase)',
     'marquee-strip'),

    # metric-unit / metrics-strip
    (r'\.metric-unit\b', r'(?:\.phone-screen-glow\b|/\* Showcase|\.showcase-sticky\b)',
     'metric-unit / metrics-strip'),

    # dead hero__ variants (orb--1, orb--2, scroll-line, split, text)
    (r'\.hero__orb\s*\{', r'(?:/\* HOW IT WORKS|/\* Steps|/\* Bento|/\* Feature|\.bento|\.feat-card|\.section-header)',
     'hero__orb / dead hero-v1 tail'),

    # showcase-sticky__header (unused sub-element)
    (r'\.showcase-sticky__header\b', r'(?:\.showcase-sticky__inner\b|\.showcase-sticky__left\b|/\* Left column)',
     'showcase-sticky__header'),

    # showcase-app nav sub-elements (dead)
    (r'\.showcase-app__nav\b\s*\{', r'(?:\.showcase-app__esim-card\b|\.adl-|/\* Active)',
     'showcase-app__nav / nav-icon / nav-item'),

    # showcase-progress / showcase-panel__icon
    (r'\.showcase-progress\b', r'(?:\.showcase-segment\b|\.showcase-sticky\b|/\* Viewport)',
     'showcase-progress / showcase-panel__icon'),

    # is-active / is-scrolled-past state classes (dead)
    (r'\.is-active\s*\{', r'(?:\n\.(?!is-)[a-z]|\n\/\*)',
     'is-active / is-scrolled-past'),
]

for start_pat, end_pat, label in BLOCKS:
    text, n = remove_block(text, start_pat, end_pat, label)
    total_removed += n

# Clean up excess blank lines
text = re.sub(r'\n{3,}', '\n\n', text)
open('css/home.css', 'w').write(text)
print(f'\n  home.css: {orig} → {text.count(chr(10))} lines  ({total_removed} removed)')
print('\nDone.')

