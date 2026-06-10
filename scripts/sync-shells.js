#!/usr/bin/env node

/**
 * sync-shells.js
 *
 * Copies index.html to every static route shell directory.
 * Each clean-URL route (e.g. /about/) needs its own index.html that is
 * byte-for-byte identical to the SPA shell so direct URL access works
 * on hosting platforms that serve directory index files.
 *
 * Usage:
 *   node scripts/sync-shells.js           # sync + exit 0
 *   node scripts/sync-shells.js --check   # dry-run; exit 1 if any shell is out of sync
 *
 * Run with --check in CI to catch accidental shell drift before deploy.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const SHELL_SRC  = path.join(ROOT, 'index.html');

// All directories that must contain an index.html identical to the SPA shell.
// Deep-link routes (join, verify-email, etc.) intentionally have their own
// custom shells with different content — they are NOT listed here.
const ROUTE_DIRS = [
  'about',
  'destinations',
  'how-it-works',
  'support',
  'privacy',
  'terms',
];

const CHECK_MODE = process.argv.includes('--check');

function main() {
  if (!fs.existsSync(SHELL_SRC)) {
    console.error('[sync-shells] ERROR: index.html not found at ' + SHELL_SRC);
    process.exit(1);
  }

  const shell   = fs.readFileSync(SHELL_SRC, 'utf8');
  let   drifted = 0;
  let   synced  = 0;

  ROUTE_DIRS.forEach(function (dir) {
    const destDir  = path.join(ROOT, dir);
    const destFile = path.join(destDir, 'index.html');

    if (!fs.existsSync(destDir)) {
      console.warn('[sync-shells] WARNING: directory missing — ' + dir + '/');
      return;
    }

    const existing = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf8') : null;

    if (existing === shell) {
      console.log('[sync-shells] OK  ' + dir + '/index.html');
      return;
    }

    if (CHECK_MODE) {
      console.error('[sync-shells] DRIFT  ' + dir + '/index.html does not match index.html');
      drifted++;
    } else {
      fs.writeFileSync(destFile, shell, 'utf8');
      console.log('[sync-shells] SYNC  ' + dir + '/index.html');
      synced++;
    }
  });

  if (CHECK_MODE) {
    if (drifted > 0) {
      console.error('\n[sync-shells] ' + drifted + ' shell(s) out of sync.');
      console.error('[sync-shells] Run: node scripts/sync-shells.js  to fix.');
      process.exit(1);
    } else {
      console.log('\n[sync-shells] All route shells are in sync.');
    }
  } else {
    console.log('\n[sync-shells] Done.' + (synced > 0 ? ' Synced ' + synced + ' shell(s).' : ' All shells were already in sync.'));
  }
}

main();
