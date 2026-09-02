/**
 * Re-encodes showcase videos for web delivery and extracts poster frames.
 *
 * Desktop outputs:
 *   public/videos/showcase-{n}.mp4
 *   public/videos/showcase-{n}-hevc.mp4
 *   public/videos/showcase-{n}.webm
 *
 * Mobile outputs (~720p portrait / 960px landscape, higher CRF):
 *   public/videos/showcase-{n}-mobile.mp4
 *   public/videos/showcase-{n}-mobile-hevc.mp4
 *   public/videos/showcase-{n}-mobile.webm
 *
 * Usage:
 *   node scripts/optimize-videos.mjs           — desktop + mobile
 *   node scripts/optimize-videos.mjs --mobile  — mobile variants only
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const videosDir = path.join(root, "public", "videos");
const postersDir = path.join(root, "public", "images", "videos");
const backupDir = path.join(root, "assets", "videos", "originals");
const mobileOnly = process.argv.includes("--mobile");

/** @type {{ id: number; aspect: "portrait" | "landscape" }[]} */
const items = [
  { id: 1, aspect: "portrait" },
  { id: 2, aspect: "landscape" },
  { id: 3, aspect: "landscape" },
  { id: 4, aspect: "landscape" },
];

function run(command) {
  execSync(command, { stdio: "inherit", cwd: root });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function backupOriginal(srcPath, name) {
  if (!fs.existsSync(srcPath)) return;
  ensureDir(backupDir);
  const dest = path.join(backupDir, name);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(srcPath, dest);
    console.log(`  backed up → ${path.relative(root, dest)}`);
  }
}

function desktopScale(aspect) {
  return aspect === "portrait"
    ? "scale='min(720,iw)':-2:flags=lanczos"
    : "scale='min(1280,iw)':-2:flags=lanczos";
}

function mobileScale(aspect) {
  return aspect === "portrait"
    ? "scale='min(480,iw)':-2:flags=lanczos"
    : "scale='min(960,iw)':-2:flags=lanczos";
}

function encodeVariants(
  input,
  aspect,
  { prefix, scale, h264Crf, hevcCrf, webmCrf },
) {
  const h264Out = path.join(videosDir, `${prefix}.mp4`);
  const h264Tmp = path.join(videosDir, `${prefix}.tmp.mp4`);
  const hevcOut = path.join(videosDir, `${prefix}-hevc.mp4`);
  const hevcTmp = path.join(videosDir, `${prefix}-hevc.tmp.mp4`);
  const webmOut = path.join(videosDir, `${prefix}.webm`);
  const webmTmp = path.join(videosDir, `${prefix}.tmp.webm`);

  console.log("  H.264…");
  run(
    [
      `ffmpeg -y -i "${input}"`,
      `-vf "${scale}"`,
      `-c:v libx264 -preset slow -crf ${h264Crf}`,
      "-movflags +faststart",
      "-an",
      `"${h264Tmp}"`,
    ].join(" "),
  );

  console.log("  HEVC…");
  run(
    [
      `ffmpeg -y -i "${input}"`,
      `-vf "${scale}"`,
      `-c:v libx265 -preset medium -crf ${hevcCrf} -tag:v hvc1`,
      "-movflags +faststart",
      "-an",
      `"${hevcTmp}"`,
    ].join(" "),
  );

  console.log("  WebM (VP9)…");
  run(
    [
      `ffmpeg -y -i "${input}"`,
      `-vf "${scale}"`,
      `-c:v libvpx-vp9 -crf ${webmCrf} -b:v 0 -row-mt 1`,
      "-an",
      `"${webmTmp}"`,
    ].join(" "),
  );

  fs.renameSync(h264Tmp, h264Out);
  fs.renameSync(hevcTmp, hevcOut);
  fs.renameSync(webmTmp, webmOut);

  return [h264Out, hevcOut, webmOut];
}

function optimizeDesktopItem({ id, aspect }) {
  const input = path.join(videosDir, `showcase-${id}.mp4`);
  if (!fs.existsSync(input)) {
    console.warn(`⚠ Skipping showcase-${id}: ${input} not found`);
    return;
  }

  console.log(`\n▶ showcase-${id} desktop (${aspect})`);
  backupOriginal(input, `showcase-${id}.mp4`);

  const posterOut = path.join(postersDir, `showcase-${id}-poster.webp`);
  const scale = desktopScale(aspect);

  console.log("  poster frame…");
  run(
    `ffmpeg -y -ss 00:00:01 -i "${input}" -frames:v 1 -vf "${scale}" -q:v 80 "${posterOut}"`,
  );

  const files = encodeVariants(input, aspect, {
    prefix: `showcase-${id}`,
    scale,
    h264Crf: 28,
    hevcCrf: 30,
    webmCrf: 38,
  });

  files.concat(posterOut).forEach((file) => {
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(`    ${path.basename(file)} — ${kb} KB`);
  });
}

function optimizeMobileItem({ id, aspect }) {
  const source = fs.existsSync(path.join(backupDir, `showcase-${id}.mp4`))
    ? path.join(backupDir, `showcase-${id}.mp4`)
    : path.join(videosDir, `showcase-${id}.mp4`);

  if (!fs.existsSync(source)) {
    console.warn(`⚠ Skipping mobile showcase-${id}: source not found`);
    return;
  }

  console.log(`\n▶ showcase-${id} mobile (${aspect})`);

  const files = encodeVariants(source, aspect, {
    prefix: `showcase-${id}-mobile`,
    scale: mobileScale(aspect),
    h264Crf: 32,
    hevcCrf: 34,
    webmCrf: 42,
  });

  files.forEach((file) => {
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(`    ${path.basename(file)} — ${kb} KB`);
  });
}

function main() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    console.error("ffmpeg is required. Install it and re-run.");
    process.exit(1);
  }

  ensureDir(postersDir);
  console.log(
    mobileOnly
      ? "Encoding mobile showcase videos…"
      : "Optimizing showcase videos…",
  );

  for (const item of items) {
    if (!mobileOnly) {
      optimizeDesktopItem(item);
    }
    optimizeMobileItem(item);
  }

  console.log("\n✓ Done.");
}

main();
