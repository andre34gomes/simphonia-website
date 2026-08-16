// One-off build-time asset pipeline: converts the raw app screenshots in
// public/screenshots/ (full-resolution PNG captures straight from the
// device, ~1.2-2.5MB each) into right-sized WebP files.
//
// Why this exists: this site deploys to Cloudflare Workers via OpenNext
// with no Cloudflare Images binding configured, so next/image's built-in
// optimizer (which needs sharp, unavailable in the workerd runtime) cannot
// run at request time. next.config.ts sets images.unoptimized = true to
// reflect that, which means whatever ships in public/ is served byte-for-
// byte in production. All resizing/compression must therefore happen here,
// at build/design time, not at runtime.
//
// Target widths are derived from each file's largest real CSS display size
// across every usage site (see PhoneMockup callers), doubled for a sharp
// 2x/retina render, then rounded to a clean number. 2x is intentionally
// used instead of 3x — for UI screenshots viewed on a marketing site this
// is visually indistinguishable from 3x but meaningfully lighter.
//
// Usage: node scripts/optimize-screenshots.mjs
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, "../public/screenshots");

// filename (without extension) -> target output width in px.
const TARGET_WIDTHS = {
  "country-detail": 960, // largest single usage: about-story.tsx hero display
};
const DEFAULT_WIDTH = 640;
const WEBP_QUALITY = 82;

async function optimizeOne(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") return null;

  const name = path.basename(filename, ext);
  const inputPath = path.join(screenshotsDir, filename);
  const outputPath = path.join(screenshotsDir, `${name}.webp`);
  const targetWidth = TARGET_WIDTHS[name] ?? DEFAULT_WIDTH;

  const before = (await stat(inputPath)).size;

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const resizeWidth = Math.min(targetWidth, metadata.width ?? targetWidth);

  await image
    .resize({ width: resizeWidth, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(outputPath);

  const after = (await stat(outputPath)).size;
  const savedPct = (100 * (1 - after / before)).toFixed(0);

  return {
    name,
    beforeKB: Math.round(before / 1024),
    afterKB: Math.round(after / 1024),
    savedPct,
    width: resizeWidth,
  };
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  const files = await readdir(screenshotsDir);

  const results = [];
  for (const file of files) {
    const result = await optimizeOne(file);
    if (result) results.push(result);
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  console.log("\nScreenshot optimization complete:\n");
  console.log(
    "name".padEnd(20),
    "width".padEnd(8),
    "before".padEnd(10),
    "after".padEnd(10),
    "saved",
  );
  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of results) {
    totalBefore += r.beforeKB;
    totalAfter += r.afterKB;
    console.log(
      r.name.padEnd(20),
      `${r.width}px`.padEnd(8),
      `${r.beforeKB}KB`.padEnd(10),
      `${r.afterKB}KB`.padEnd(10),
      `-${r.savedPct}%`,
    );
  }
  const totalSavedPct = (100 * (1 - totalAfter / totalBefore)).toFixed(0);
  console.log(
    `\nTotal: ${totalBefore}KB -> ${totalAfter}KB (-${totalSavedPct}%)\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
