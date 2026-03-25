# Scroll regression tests

These tests exercise the shared scroll coordinator used by all pages.

## Run

```sh
npm test
```

## What is covered

- class-based scroll lock toggling
- deduped `ScrollTrigger.refresh()` scheduling
- delayed refresh until `load`
- hash target focus without forcing another scroll
- `pageshow` recovery after cached navigation
- resize-triggered refresh when viewport width changes

