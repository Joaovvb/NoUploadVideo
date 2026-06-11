/** Must match @ffmpeg/core and @ffmpeg/core-mt in package.json */
export const FFMPEG_CORE_VERSION = '0.12.6';

/**
 * WASM binaries exceed Cloudflare Pages' 25 MiB per-file limit (~31 MiB each).
 * Served from unpkg at runtime; .js assets stay same-origin in /public.
 */
export const FFMPEG_CDN_BASE = {
  single: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`,
  multi: `https://unpkg.com/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm`,
} as const;
