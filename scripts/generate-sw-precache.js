#!/usr/bin/env node

/**
 * generate-sw-precache.js
 *
 * Scans the project directories and auto-generates the PRECACHE_URLS array
 * in sw.js based on actual files on disk.
 *
 * Usage:
 *   node scripts/generate-sw-precache.js
 *
 * Run this before deploying to ensure the service worker caches all current assets.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SW_PATH = path.join(ROOT, 'sw.js');

// Directories and file patterns to include
const PAGES = ['/', '/index.html', '/404.html'];
const PAGE_DIRS = ['about', 'destinations', 'how-it-works', 'support', 'privacy', 'terms'];
const CSS_DIR = 'css';
const JS_DIR = 'js';
const ASSETS_DIR = 'assets';
const ASSET_EXTS = ['.svg', '.png', '.webp', '.ico'];

function getFiles(dir, exts) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return exts ? exts.includes(ext) : true;
    })
    .map(f => '/' + dir + '/' + f);
}

function buildPrecacheList() {
  const urls = [...PAGES];

  // Page directories (each has index.html)
  PAGE_DIRS.forEach(dir => {
    const indexPath = path.join(ROOT, dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      urls.push('/' + dir + '/');
    }
  });

  // CSS files
  urls.push(...getFiles(CSS_DIR, ['.css']));

  // JS files (top-level and components)
  urls.push(...getFiles(JS_DIR, ['.js']));
  const componentsDir = path.join(JS_DIR, 'components');
  urls.push(...getFiles(componentsDir, ['.js']));

  // Assets
  urls.push(...getFiles(ASSETS_DIR, ASSET_EXTS));

  // Manifest
  if (fs.existsSync(path.join(ROOT, 'manifest.json'))) {
    urls.push('/manifest.json');
  }

  return urls;
}

function updateServiceWorker(urls) {
  let sw = fs.readFileSync(SW_PATH, 'utf-8');

  const arrayStr = '[\n' + urls.map(u => "  '" + u + "'").join(',\n') + ',\n]';

  // Replace the PRECACHE_URLS array
  sw = sw.replace(
    /const PRECACHE_URLS = \[[\s\S]*?\];/,
    'const PRECACHE_URLS = ' + arrayStr + ';'
  );

  fs.writeFileSync(SW_PATH, sw, 'utf-8');
  console.log('[generate-sw-precache] Updated PRECACHE_URLS with ' + urls.length + ' entries.');
}

const urls = buildPrecacheList();
updateServiceWorker(urls);

