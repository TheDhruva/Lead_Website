/**
 * Re-encodes showcase videos for web delivery and extracts poster frames.
 *
 * Outputs:
 *   public/videos/showcase-{n}.mp4        — H.264 (compatible fallback)
 *   public/videos/showcase-{n}-hevc.mp4   — HEVC (Safari / iOS)
 *   public/videos/showcase-{n}.webm       — VP9 (Chrome / Firefox)
 *   public/images/videos/showcase-{n}-poster.webp
 *
 * Usage: node scripts/optimize-videos.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const videosDir = path.join(root, "public", "videos");
const postersDir = path.join(root, "public", "images", "videos");
const backupDir = path.join(root, "assets", "videos", "originals");

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

function optimizeItem({ id, aspect }) {
  const input = path.join(videosDir, `showcase-${id}.mp4`);
  if (!fs.existsSync(input)) {
    console.warn(`⚠ Skipping showcase-${id}: ${input} not found`);
    return;
  }

  console.log(`\n▶ showcase-${id} (${aspect})`);

  const posterOut = path.join(postersDir, `showcase-${id}-poster.webp`);
  const h264Out = path.join(videosDir, `showcase-${id}.mp4`);
  const h264Tmp = path.join(videosDir, `showcase-${id}.tmp.mp4`);
  const hevcOut = path.join(videosDir, `showcase-${id}-hevc.mp4`);
  const hevcTmp = path.join(videosDir, `showcase-${id}-hevc.tmp.mp4`);
  const webmOut = path.join(videosDir, `showcase-${id}.webm`);
  const webmTmp = path.join(videosDir, `showcase-${id}.tmp.webm`);

  backupOriginal(h264Out, `showcase-${id}.mp4`);

  const scale =
    aspect === "portrait"
      ? "scale='min(720,iw)':-2:flags=lanczos"
      : "scale='min(1280,iw)':-2:flags=lanczos";

  console.log("  poster frame…");
  run(
    `ffmpeg -y -ss 00:00:01 -i "${input}" -frames:v 1 -vf "${scale}" -q:v 80 "${posterOut}"`,
  );

  console.log("  H.264…");
  run(
    [
      `ffmpeg -y -i "${input}"`,
      `-vf "${scale}"`,
      "-c:v libx264 -preset slow -crf 28",
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
      "-c:v libx265 -preset medium -crf 30 -tag:v hvc1",
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
      "-c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1",
      "-an",
      `"${webmTmp}"`,
    ].join(" "),
  );

  fs.renameSync(h264Tmp, h264Out);
  fs.renameSync(hevcTmp, hevcOut);
  fs.renameSync(webmTmp, webmOut);

  const sizes = [h264Out, hevcOut, webmOut, posterOut].map((file) => {
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    return `    ${path.basename(file)} — ${kb} KB`;
  });
  console.log(sizes.join("\n"));
}

function main() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    console.error("ffmpeg is required. Install it and re-run.");
    process.exit(1);
  }

  ensureDir(postersDir);
  console.log("Optimizing showcase videos…");

  for (const item of items) {
    optimizeItem(item);
  }

  console.log("\n✓ Done. Originals saved in assets/videos/originals/");
}

main();
