# Video assets

Showcase videos (muted, looping):

- `showcase-1.mp4` — portrait feature
- `showcase-2.mp4` — landscape
- `showcase-3.mp4` — landscape
- `showcase-4.mp4` — landscape

Each clip also has HEVC (`.mp4` with `-hevc` suffix) and WebM (`.webm`) variants for smaller delivery. Poster frames live in `public/images/videos/showcase-{n}-poster.webp`.

## Re-encode / regenerate

After replacing source footage, run:

```bash
npm run optimize:videos
```

This backs up originals to `assets/videos/originals/` (not served publicly), re-encodes all formats, and extracts poster frames. Requires [ffmpeg](https://ffmpeg.org/).
