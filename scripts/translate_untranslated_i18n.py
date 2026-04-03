#!/usr/bin/env python3
"""Translate missing or English-placeholder locale values from en.json.

Usage:
  python3 scripts/translate_untranslated_i18n.py
  python3 scripts/translate_untranslated_i18n.py --locales pt es fr

Requires:
  python3 -m pip install --user deep-translator
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
I18N_DIR = ROOT / 'js' / 'i18n'
EN_PATH = I18N_DIR / 'en.json'
LANGUAGE_MAP = {
    'ar': 'ar',
    'cs': 'cs',
    'de': 'de',
    'es': 'es',
    'fa': 'fa',
    'fr': 'fr',
    'hi': 'hi',
    'hu': 'hu',
    'id': 'id',
    'it': 'it',
    'ja': 'ja',
    'ko': 'ko',
    'nl': 'nl',
    'pl': 'pl',
    'pt': 'pt',
    'ru': 'ru',
    'tr': 'tr',
    'uk': 'uk',
    'vi': 'vi',
    'zh': 'zh-CN',
}
SKIP_KEYS = {
    'lang.names.ar', 'lang.names.cs', 'lang.names.de', 'lang.names.en', 'lang.names.es',
    'lang.names.fa', 'lang.names.fr', 'lang.names.hi', 'lang.names.hu', 'lang.names.id',
    'lang.names.it', 'lang.names.ja', 'lang.names.ko', 'lang.names.nl', 'lang.names.pl',
    'lang.names.pt', 'lang.names.ru', 'lang.names.tr', 'lang.names.uk', 'lang.names.vi',
    'lang.names.zh',
}
TOKEN_RE = re.compile(r'(__TK_\d+__)')
TAG_RE = re.compile(r'<[^>]+>')
VAR_RE = re.compile(r'\{[^{}]+\}')


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def protect_text(text: str):
    tokens = []

    def replace(match):
        token = f'__TK_{len(tokens)}__'
        tokens.append((token, match.group(0)))
        return token

    protected = TAG_RE.sub(replace, text)
    protected = VAR_RE.sub(replace, protected)
    return protected, tokens


TOKEN_FIXUPS = {
    '__tk_': '__TK_',
    '__ Tk_': '__TK_',
    '__ TK_': '__TK_',
    '__TK ': '__TK_',
    ' __': '__',
}


def restore_text(text: str, tokens):
    restored = text
    for src, dst in TOKEN_FIXUPS.items():
        restored = restored.replace(src, dst)
    restored = restored.replace('__ TK_', '__TK_').replace('__tk_', '__TK_')
    for token, original in tokens:
        restored = restored.replace(token, original)
    return restored


def should_translate(path: str, locale_value, english_value, missing_only: bool) -> bool:
    if path in SKIP_KEYS:
        return False
    if locale_value is None:
        return True
    if missing_only:
        return False
    return locale_value == english_value


def translate_one(source_locale: str, target_locale: str, translator: GoogleTranslator, value: str) -> str:
    try:
        return translator.translate(value)
    except Exception:
        try:
            translated = translator.translate_batch([value])
            if isinstance(translated, list) and translated:
                return translated[0]
        except Exception:
            pass
        return value


def translate_strings(source_locale: str, target_locale: str, translator: GoogleTranslator, values: list[str]) -> list[str]:
    if not values:
        return []
    results: list[str] = []
    for start in range(0, len(values), 25):
        chunk = values[start:start + 25]
        try:
            translated = translator.translate_batch(chunk)
            if isinstance(translated, str):
                translated = [translated]
        except Exception:
            translated = [translate_one(source_locale, target_locale, translator, item) for item in chunk]
        results.extend(translated)
        time.sleep(0.15)
    return results


def sync_value(source_locale: str, target_locale: str, translator: GoogleTranslator, path: str, english_value, locale_value, missing_only: bool):
    if isinstance(english_value, dict):
        next_value = locale_value if isinstance(locale_value, dict) else {}
        return {
            key: sync_value(
                source_locale,
                target_locale,
                translator,
                f'{path}.{key}' if path else key,
                english_value[key],
                next_value.get(key),
                missing_only,
            )
            for key in english_value
        }

    if isinstance(english_value, list):
        if not should_translate(path, locale_value, english_value, missing_only):
            return locale_value
        if not all(isinstance(item, str) for item in english_value):
            return english_value
        protected_items = [protect_text(item) for item in english_value]
        translated = translate_strings(source_locale, target_locale, translator, [item for item, _ in protected_items])
        return [restore_text(item, tokens) for item, (_, tokens) in zip(translated, protected_items)]

    if not isinstance(english_value, str):
        return english_value if locale_value is None else locale_value

    if not should_translate(path, locale_value, english_value, missing_only):
        return locale_value

    protected, tokens = protect_text(english_value)
    translated = translate_one(source_locale, target_locale, translator, protected)
    return restore_text(translated, tokens)


def main() -> int:
    parser = argparse.ArgumentParser(description='Translate missing/untranslated locale values from en.json.')
    parser.add_argument('--locales', nargs='*', default=sorted(LANGUAGE_MAP), help='locale codes to process')
    parser.add_argument('--missing-only', action='store_true', help='only fill keys that are absent from a locale file')
    args = parser.parse_args()

    english = load_json(EN_PATH)

    for locale in args.locales:
        target = LANGUAGE_MAP.get(locale)
        if not target:
            raise SystemExit(f'Unsupported locale: {locale}')
        locale_path = I18N_DIR / f'{locale}.json'
        locale_data = load_json(locale_path) if locale_path.exists() else {}
        translator = GoogleTranslator(source='en', target=target)
        translated = sync_value('en', target, translator, '', english, locale_data, args.missing_only)
        dump_json(locale_path, translated)
        print(f'Updated {locale_path.name}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())




