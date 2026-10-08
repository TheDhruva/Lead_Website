/**
 * Shared lightweight blur placeholder for below-fold next/image sets.
 * A 1×1 FULLY TRANSPARENT pixel stretched by the blur filter — avoids
 * per-image blur-file generation while preventing blank → pop on lazy
 * mount. Transparent (never tinted): the previous revision encoded a
 * semi-transparent pure-green pixel, which flashed green on every
 * freshly mounting sheet during fast deck scrolling.
 */
export const BLUR_PLACEHOLDER_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=";
