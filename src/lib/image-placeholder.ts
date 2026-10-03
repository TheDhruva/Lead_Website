/**
 * Shared lightweight blur placeholder for below-fold next/image sets.
 * A 1×1 neutral pixel stretched by the blur filter — avoids per-image
 * blur-file generation while preventing blank → pop on lazy mount.
 */
export const BLUR_PLACEHOLDER_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
