#!/usr/bin/env python3
"""Update the English i18n schema and report locale drift without copying English placeholders.

This keeps `en.json` as the canonical schema while avoiding the old behavior of
silently masking missing translations in other locale files.
"""

from __future__ import annotations

import glob
import json
from pathlib import Path

# ── New top-level sections ──────────────────────────────────────
NEW_TOP_LEVEL = {
    "page": {
        "titles": {
            "home": "Simphonia \u2014 Stay Connected, Wherever You Go.",
            "destinations": "Destinations \u2014 Simphonia eSIM",
            "howItWorks": "How It Works \u2014 Simphonia eSIM",
            "support": "Support & FAQ \u2014 Simphonia eSIM",
            "about": "About \u2014 Simphonia eSIM",
            "privacy": "Privacy Policy \u2014 Simphonia eSIM",
            "terms": "Terms of Service \u2014 Simphonia eSIM"
        }
    },
    "accessibility": {
        "scrollProgress": "Page scroll progress",
        "cookieConsent": "Cookie consent",
        "mainNavigation": "Main navigation",
        "mobileMenu": "Mobile menu",
        "faqNav": "Frequently asked questions",
        "tableOfContents": "Table of contents",
        "searchCountries": "Search countries",
        "clearSearch": "Clear search",
        "searchFaq": "Search FAQ",
        "quickLinks": "Quick links"
    },
    "imgAlt": {
        "travelerDeparture": "Traveler looking at a departure board",
        "browsingPlans": "Browsing destination plans",
        "secureCheckout": "Secure checkout on phone",
        "travelerAbroad": "Traveler connected abroad"
    }
}

# ── Additions to home.hero ──────────────────────────────────────
HOME_HERO_ADD = {
    "downloadOnAppStore": "Download on the App Store",
    "downloadOnGooglePlay": "Download on Google Play",
    "iconSearch": "Search",
    "iconLightning": "Lightning bolt",
    "iconGlobe": "Globe"
}

# ── Additions to home.showcase ─────────────────────────────────
HOME_SHOWCASE_ADD = {
    "appBrowseHeading": "Browse",
    "appSearchPlaceholder": "Search 200+ destinations\u2026",
    "appFilterAll": "All",
    "appFilterAsia": "\U0001f30f Asia",
    "appFilterEurope": "\U0001f30d Europe",
    "appFilterAmericas": "\U0001f30e Americas",
    "appPopularNow": "Popular Now",
    "appCheckoutHeading": "Checkout",
    "appInstantDelivery": "\u26a1 Instant delivery",
    "appPayApplePay": "Pay with Apple Pay",
    "appPayOr": "\u2014 or \u2014",
    "appPayCard": "Pay with card",
    "appSecurePayment": "Secure payment \u00b7 SSL encrypted",
    "appMyEsims": "My eSIMs",
    "appActivePlans": "Active Plans",
    "appActiveStatus": "Active",
    "appDataUsage": "Data Usage",
    "appDataUsed": "1.6 GB used",
    "appDataLeft": "3.4 GB left",
    "appDaysLeft": "Days Left",
    "appNetwork": "Network",
    "appPlanPrice": "Plan Price",
    "appTotalData": "Total Data",
    "appAiName": "Simphonia AI",
    "appAiOnline": "Online \u00b7 responds instantly",
    "appChatMsg1User": "How do I activate my eSIM?",
    "appChatMsg1Ai": "Open <b>Settings \u2192 Cellular \u2192 Add eSIM</b>, scan the QR code in the app. Done in seconds! \U0001f680",
    "appChatMsg2User": "How much data is left?",
    "appChatMsg2Ai": "You have <b>3.4 GB</b> remaining on Portugal \u00b7 7 days left.",
    "appChatPlaceholder": "Ask anything\u2026",
    "navHome": "Home",
    "navBrowse": "Browse",
    "navMyEsims": "My eSIMs",
    "navProfile": "Profile"
}

# ── Additions to error404 ──────────────────────────────────────
ERROR404_ADD = {
    "copyLinkAriaLabel": "Copy this page URL to clipboard",
    "copyFailed": "Failed",
    "quickLinks": "Quick links"
}


def fill_missing(target, source):
    """Recursively add keys present in source but missing in target."""
    for key, value in source.items():
        if key not in target:
            target[key] = value
        elif isinstance(value, dict) and isinstance(target.get(key), dict):
            fill_missing(target[key], value)


ROOT = Path(__file__).resolve().parents[1]
I18N_DIR = ROOT / 'js' / 'i18n'


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


# ── Update en.json ─────────────────────────────────────────────
with open(I18N_DIR / 'en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

for key, val in NEW_TOP_LEVEL.items():
    if key not in en:
        en[key] = val
    else:
        fill_missing(en[key], val)

fill_missing(en['home']['hero'], HOME_HERO_ADD)
fill_missing(en['home']['showcase'], HOME_SHOWCASE_ADD)
fill_missing(en['error404'], ERROR404_ADD)

with open(I18N_DIR / 'en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
    f.write('\n')

print("Updated en.json")

# ── Report non-English schema drift instead of propagating English ─────────
en_flat = flatten(en)

for lang_file in sorted(glob.glob(str(I18N_DIR / '*.json'))):
    if lang_file == str(I18N_DIR / 'en.json'):
        continue
    with open(lang_file, 'r', encoding='utf-8') as f:
        lang_data = json.load(f)

    lang_flat = flatten(lang_data)
    missing = sorted(set(en_flat) - set(lang_flat))
    extra = sorted(set(lang_flat) - set(en_flat))
    if missing or extra:
        print(f"Schema drift in {Path(lang_file).name}:")
        if missing:
            print('  missing:', ', '.join(missing[:20]))
        if extra:
            print('  extra:', ', '.join(extra[:20]))
    else:
        print(f"Schema OK: {Path(lang_file).name}")

print("Done! No English placeholders were copied into non-English locale files.")

