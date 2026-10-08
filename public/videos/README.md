# Video assets

Showcase videos (muted, looping). Each clip ships as a normalized ladder —
desktop + mobile variants in MP4, HEVC (`-hevc`), and WebM:

- `showcase-{n}-norm.mp4` / `showcase-{n}-norm.webm` — desktop
- `showcase-{n}-hevc-norm.mp4` — desktop HEVC
- `showcase-{n}-mobile-norm.mp4` / `showcase-{n}-mobile-norm.webm` — mobile
- `showcase-{n}-mobile-hevc-norm.mp4` — mobile HEVC

Clips 1–5 are landscape, clip 6 is portrait. Poster frames live in
`public/images/videos/showcase-{n}-poster.webp`.

## Re-encode / regenerate

After replacing source footage, run:

```bash
npm run optimize:videos
```

This backs up originals to `assets/videos/originals/` (not served publicly), re-encodes all formats, and extracts poster frames. Requires [ffmpeg](https://ffmpeg.org/).
