#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'js' / 'i18n'
ENGLISH = BASE / 'en.json'
SKIP_IDENTICAL = {
    'lang.names.ar', 'lang.names.cs', 'lang.names.de', 'lang.names.en', 'lang.names.es',
    'lang.names.fa', 'lang.names.fr', 'lang.names.hi', 'lang.names.hu', 'lang.names.id',
    'lang.names.it', 'lang.names.ja', 'lang.names.ko', 'lang.names.nl', 'lang.names.pl',
    'lang.names.pt', 'lang.names.ru', 'lang.names.tr', 'lang.names.uk', 'lang.names.vi',
    'lang.names.zh',
}


def flatten(value, prefix=''):
    out = {}
    if isinstance(value, dict):
        for key, child in value.items():
            child_prefix = f'{prefix}.{key}' if prefix else key
            out.update(flatten(child, child_prefix))
    elif isinstance(value, list):
        out[prefix] = value
    else:
        out[prefix] = value
    return out


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def main() -> int:
    parser = argparse.ArgumentParser(description='Check locale key parity against en.json.')
    parser.add_argument('--fail-on-identical', action='store_true', help='also fail when non-English values still match English')
    args = parser.parse_args()

    english = flatten(load(ENGLISH))
    locales = sorted(path for path in BASE.glob('*.json') if path.name != 'en.json')
    has_error = False

    for locale_path in locales:
        locale = flatten(load(locale_path))
        missing = sorted(set(english) - set(locale))
        extra = sorted(set(locale) - set(english))
        type_mismatch = sorted(
            key for key in (set(english) & set(locale))
            if type(english[key]) is not type(locale[key])
        )
        identical = sorted(
            key for key in (set(english) & set(locale))
            if key not in SKIP_IDENTICAL and locale[key] == english[key]
        )

        if missing or extra or type_mismatch or (args.fail_on_identical and identical):
            has_error = True

        print(f'[{locale_path.stem}] leaves={len(locale)} missing={len(missing)} extra={len(extra)} type_mismatch={len(type_mismatch)} identical_to_en={len(identical)}')
        if missing:
            print('  missing:', ', '.join(missing[:10]))
        if extra:
            print('  extra:', ', '.join(extra[:10]))
        if type_mismatch:
            print('  type mismatch:', ', '.join(type_mismatch[:10]))
        if identical:
            print('  identical sample:', ', '.join(identical[:10]))

    return 1 if has_error else 0


if __name__ == '__main__':
    raise SystemExit(main())

