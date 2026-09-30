/**
 * Processed SFX pipeline for THE DHRUVA portfolio.
 *
 * Sources (see public/audio/sources/manifest.json for licensing):
 * - 2 × CC0 mouse clicks from Wikimedia Commons (tactile UI sounds)
 * - 3 × locally synthesized beds (intro swell, transition air, card air)
 *
 * Each output is: silence-trimmed, peak-managed, short-faded and QA'd
 * for duration + headroom. MP3 mono keeps the total payload tiny.
 *
 * Usage:
 *   node scripts/process-sfx.mjs --src-dir <dir-with-commons-files>
 *
 * Re-runs are deterministic (fixed synth seeds). Exits non-zero on any
 * QA violation so bad audio can never slip into a build silently.
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "audio", "sfx");
const manifestPath = join(root, "public", "audio", "sources", "manifest.json");

const args = process.argv.slice(2);
const srcDirFlag = args.indexOf("--src-dir");
const srcDir =
  srcDirFlag >= 0 && args[srcDirFlag + 1]
    ? resolve(args[srcDirFlag + 1])
    : join(
        "C:",
        "Users",
        "immor",
        "AppData",
        "Local",
        "Temp",
        "opencode",
        "audio-src",
      );

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${cmd} exited ${result.status}: ${(result.stderr || "").slice(0, 400)}`,
    );
  }
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function probeDurationSeconds(file) {
  const out = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return Number.parseFloat(out.trim());
}

function probePeakDb(file) {
  const out = run("ffmpeg", [
    "-hide_banner",
    "-i",
    file,
    "-af",
    "volumedetect",
    "-f",
    "null",
    "-",
  ]);
  const err = out;
  const match = /max_volume:\s*(-?[\d.]+)\s*dB/.exec(err);
  // volumedetect writes to stderr; execFileSync with piped stderr merges above.
  return match ? Number.parseFloat(match[1]) : Number.NaN;
}

function trimToTemp(srcFile, tag, windowStart, windowEnd) {
  const tmp = join(tmpdir(), `dhruva-trim-${tag}-${Date.now()}.wav`);
  run("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    srcFile,
    "-af",
    `atrim=start=${windowStart}:end=${windowEnd},asetpts=PTS-STARTPTS`,
    ...TRIM_WAV_ARGS,
    tmp,
  ]);
  return tmp;
}

function finalizeTrimmed(tmpFile, chain, outFile, fadeInMs = 0) {
  const durationMs = Math.round(probeDurationSeconds(tmpFile) * 1000);
  const fadeOutMs = 30;
  const fadeStartMs = Math.max(0, durationMs - fadeOutMs);
  // Note: no fade-in by default — even 1ms softens a click attack by
  // ~12dB. Files start at trimmed silence so no boundary click occurs.
  const fadeIn = fadeInMs > 0 ? `,afade=t=in:st=0:d=${fadeInMs}` : "";
  run("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    tmpFile,
    "-af",
    `${chain}${fadeIn},afade=t=out:st=${fadeStartMs}ms:d=${fadeOutMs}ms`,
    "-ac",
    "1",
    "-ar",
    "44100",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "128k",
    outFile,
  ]);
  return durationMs;
}

// Mastering: peak-normalize the finished file to a target peak so the
// SOUND_CONFIG playback gains land at the designed perceived levels.
// Single extra generation; MP3 128k artifacts are negligible for SFX.
function masterToPeak(outFile, targetDb, renderFn) {
  renderFn();
  for (let pass = 0; pass < 2; pass += 1) {
    const peakDb = probePeakDb(outFile);
    if (!Number.isFinite(peakDb)) {
      throw new Error(`unmeasurable peak in ${outFile}`);
    }
    const delta = targetDb - peakDb;
    if (Math.abs(delta) < 0.5) return peakDb;
    renderFn(delta);
  }
  const peakDb = probePeakDb(outFile);
  if (Math.abs(targetDb - peakDb) >= 1.5) {
    throw new Error(`mastering did not converge (${outFile}: ${peakDb}dB)`);
  }
  return peakDb;
}

// ---------------------------------------------------------------------------
// Jobs: [key, inputs, filter-complex producing [out], duration + peak limits]
// ---------------------------------------------------------------------------
const SRC = {
  single: join(srcDir, "Computer_mouse_single_click.ogg"),
  right: join(srcDir, "Computer_mouse_right_click.ogg"),
};

// Recorded clicks carry ~300ms of room tone before the transient (measured
// per-file: S1 peaks at 0.31s/0.39s, S2 at 0.34s/0.46s). Blind silence
// trimming cannot isolate them, so each job declares an explicit window
// around the wanted transient(s) — deterministic and verified by QA.

const jobs = [
  {
    key: "ui-click",
    kind: "recorded",
    inputs: [SRC.single],
    // Window covers the press (-2.6dB @0.31s) + release (0dB @0.39s) pair.
    window: [0.3, 0.46],
    // Sharp tactile transient; no fade-in (file starts in room tone).
    chain: "highpass=f=180",
    fadeInMs: 0,
    masterPeakDb: -3,
    minMs: 40,
    maxMs: 180,
    source: {
      local: "Computer_mouse_single_click.ogg",
      title: "Computer mouse single click",
      author: "Darklanlan (Wikimedia Commons)",
      license: "CC0 1.0 Universal",
      licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://upload.wikimedia.org/wikipedia/commons/2/26/Computer_mouse_single_click.ogg",
    },
  },
  {
    key: "nav-click",
    kind: "recorded",
    inputs: [SRC.single],
    note: "Derived from the same CC0 click; attack softened into a tick.",
    window: [0.3, 0.46],
    chain: "highpass=f=180",
    fadeInMs: 0.012,
    masterPeakDb: -3,
    minMs: 50,
    maxMs: 250,
    source: {
      local: "Computer_mouse_single_click.ogg (derived)",
      title: "Computer mouse single click (derived softer tick)",
      author:
        "Darklanlan (Wikimedia Commons), derived processing by THE DHRUVA",
      license: "CC0 1.0 Universal",
      licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://upload.wikimedia.org/wikipedia/commons/2/26/Computer_mouse_single_click.ogg",
    },
  },
  {
    key: "video-control",
    kind: "recorded",
    inputs: [SRC.right],
    // Right-click source: single transient at 0.44-0.48s with pre-roll.
    window: [0.42, 0.58],
    chain: "highpass=f=180",
    fadeInMs: 0,
    masterPeakDb: -3,
    minMs: 40,
    maxMs: 180,
    source: {
      local: "Computer_mouse_right_click.ogg",
      title: "Computer mouse right click",
      author: "Darklanlan (Wikimedia Commons)",
      license: "CC0 1.0 Universal",
      licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://upload.wikimedia.org/wikipedia/commons/4/4a/Computer_mouse_right_click.ogg",
    },
  },
  {
    key: "service-expand",
    kind: "synth",
    note: "Synthesized air movement (filtered noise, fixed seed). Original work.",
    synthInputs: [
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=color=white:duration=0.4:seed=11",
    ],
    synthFilter: (volumeDb) =>
      `[0:a]bandpass=f=650:w=1.1,afade=t=in:st=0:d=0.12,afade=t=out:st=0.24:d=0.16,volume=${volumeDb}dB[out]`,
    masterPeakDb: -6,
    minMs: 100,
    maxMs: 400,
    source: {
      local: null,
      title: "Soft card air movement (synthesized)",
      author: "THE DHRUVA (procedural synthesis, original work)",
      license: "Original work created for this project — no third-party rights",
      licenseUrl: null,
      source: "synthesized locally with FFmpeg (deterministic seed 11)",
    },
  },
  {
    key: "hero-transition",
    kind: "synth",
    note: "Synthesized air movement (filtered noise, fixed seed). Original work.",
    synthInputs: [
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=color=white:duration=0.65:seed=23",
    ],
    synthFilter: (volumeDb) =>
      `[0:a]bandpass=f=1050:w=0.9,afade=t=in:st=0:d=0.1,afade=t=out:st=0.4:d=0.25,volume=${volumeDb}dB[out]`,
    masterPeakDb: -6,
    minMs: 250,
    maxMs: 700,
    source: {
      local: null,
      title: "Cinematic transition air (synthesized)",
      author: "THE DHRUVA (procedural synthesis, original work)",
      license: "Original work created for this project — no third-party rights",
      licenseUrl: null,
      source: "synthesized locally with FFmpeg (deterministic seed 23)",
    },
  },
  {
    key: "intro-swell",
    kind: "synth",
    note: "Synthesized low tonal swell (layered sines). Original work.",
    synthInputs: [
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=110:duration=1.7",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=164.81:duration=1.7",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=220:duration=1.7",
    ],
    synthFilter: (volumeDb) =>
      `[0:a][1:a][2:a]amix=inputs=3:normalize=0,afade=t=in:st=0:d=0.55,afade=t=out:st=1.1:d=0.6,volume=${volumeDb}dB[out]`,
    masterPeakDb: -6,
    minMs: 700,
    maxMs: 1800,
    source: {
      local: null,
      title: "Low cinematic swell (synthesized)",
      author: "THE DHRUVA (procedural synthesis, original work)",
      license: "Original work created for this project — no third-party rights",
      licenseUrl: null,
      source: "synthesized locally with FFmpeg (110/164.81/220 Hz)",
    },
  },
];

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(manifestPath), { recursive: true });

const failures = [];
const manifestAssets = [];

for (const job of jobs) {
  const outFile = join(outDir, `${job.key}.mp3`);
  let tmp = null;
  try {
    if (job.kind === "synth") {
      const renderSynth = (volumeDb = 0) => {
        run("ffmpeg", [
          "-hide_banner",
          "-y",
          ...job.synthInputs,
          "-filter_complex",
          job.synthFilter(volumeDb),
          "-map",
          "[out]",
          "-ac",
          "1",
          "-ar",
          "44100",
          "-codec:a",
          "libmp3lame",
          "-b:a",
          "128k",
          outFile,
        ]);
      };
      masterToPeak(outFile, job.masterPeakDb, renderSynth);
    } else {
      for (const input of job.inputs) {
        if (!existsSync(input)) {
          throw new Error(`missing source file: ${input}`);
        }
      }
      tmp = trimToTemp(job.inputs[0], job.key, job.window[0], job.window[1]);
      const renderClick = (volumeDb = 0) => {
        const base =
          volumeDb === 0 ? job.chain : `${job.chain},volume=${volumeDb}dB`;
        finalizeTrimmed(tmp, base, outFile, job.fadeInMs ?? 0);
      };
      masterToPeak(outFile, job.masterPeakDb, renderClick);
    }

    const durationMs = Math.round(probeDurationSeconds(outFile) * 1000);
    const peakDb = probePeakDb(outFile);
    const okDuration = durationMs >= job.minMs && durationMs <= job.maxMs;
    const okPeak = Number.isFinite(peakDb) && peakDb < -1.0;
    const status = okDuration && okPeak ? "OK  " : "FAIL";
    console.log(
      `${status} ${job.key}.mp3 — ${durationMs}ms (spec ${job.minMs}-${job.maxMs}ms), peak ${peakDb}dB`,
    );
    if (!okDuration || !okPeak) {
      failures.push(`${job.key}: duration=${durationMs}ms peak=${peakDb}dB`);
    }
    manifestAssets.push({
      ...job.source,
      file: `sfx/${job.key}.mp3`,
      durationMs,
      peakDb,
      downloadedAt:
        job.kind === "synth" ? null : new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    failures.push(`${job.key}: ${error.message}`);
    console.log(`FAIL ${job.key}.mp3 — ${error.message}`);
  } finally {
    if (tmp && existsSync(tmp)) {
      rmSync(tmp, { force: true });
    }
  }
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} QA FAILURE(S):\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}

writeFileSync(
  manifestPath,
  JSON.stringify({ assets: manifestAssets }, null, 2) + "\n",
);
console.log(`\nWrote ${manifestPath} (${manifestAssets.length} assets)`);
