#!/usr/bin/env node

/**
 * stamp-version.js
 *
 * Replaces all asset version query strings (?v=YYYYMMDD...) in index.html,
 * sw.js, and main.js with a consistent version stamp based on the current date.
 *
 * This eliminates the error-prone manual sync of version strings across files.
 *
 * Usage:
 *   node scripts/stamp-version.js              # stamps with today's date
 *   node scripts/stamp-version.js 20260415     # stamps with a custom version
 *
 * Run this before deploying and before generate-sw-precache.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files that contain versioned asset references
const FILES = [
  'index.html',
  'sw.js',
  'js/main.js',
];

// Generate version stamp: YYYYMMDD (or use CLI argument)
function getVersionStamp() {
  if (process.argv[2]) return process.argv[2];

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// Matches ?v=20260402, ?v=20260403b, ?v=20260403c, etc.
const VERSION_PATTERN = /(\?v=)\d{8}[a-z]*/g;

function stampFile(filePath, version) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[stamp-version] Skipping missing file: ${filePath}`);
    return 0;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  let count = 0;
  const updated = content.replace(VERSION_PATTERN, () => {
    count++;
    return `?v=${version}`;
  });

  if (count > 0) {
    fs.writeFileSync(fullPath, updated, 'utf-8');
  }
  return count;
}

// Also update the CACHE_VERSION in sw.js to force cache invalidation
function stampCacheVersion(version) {
  const swPath = path.join(ROOT, 'sw.js');
  if (!fs.existsSync(swPath)) return 0;

  let sw = fs.readFileSync(swPath, 'utf-8');
  const versionNum = parseInt(
    (sw.match(/const CACHE_VERSION = 'simphonia-v(\d+)'/) || [])[1] || '0',
    10
  );
  const newVersion = versionNum + 1;

  const updated = sw.replace(
    /const CACHE_VERSION = 'simphonia-v\d+'/,
    `const CACHE_VERSION = 'simphonia-v${newVersion}'`
  );

  if (updated !== sw) {
    fs.writeFileSync(swPath, updated, 'utf-8');
    console.log(`[stamp-version] Bumped CACHE_VERSION to simphonia-v${newVersion}`);
    return 1;
  }
  return 0;
}

const version = getVersionStamp();
let totalReplacements = 0;

FILES.forEach(file => {
  const count = stampFile(file, version);
  if (count > 0) {
    console.log(`[stamp-version] ${file}: ${count} version strings → ?v=${version}`);
  }
  totalReplacements += count;
});

stampCacheVersion(version);

console.log(`[stamp-version] Done. ${totalReplacements} replacements with v=${version}`);

