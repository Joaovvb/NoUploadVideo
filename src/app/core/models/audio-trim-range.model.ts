/** Seconds-based trim window for audio extraction (MP3). */
export interface AudioTrimRange {
  startSec: number;
  endSec: number;
}

export const MIN_TRIM_DURATION_SEC = 0.5;

export function isValidTrimRange(
  range: AudioTrimRange | null | undefined,
  mediaDurationSec: number,
): range is AudioTrimRange {
  if (!range) {
    return false;
  }

  const { startSec, endSec } = range;
  const maxEnd = mediaDurationSec > 0 ? mediaDurationSec : endSec;

  return (
    Number.isFinite(startSec) &&
    Number.isFinite(endSec) &&
    startSec >= 0 &&
    endSec > startSec &&
    endSec - startSec >= MIN_TRIM_DURATION_SEC &&
    (mediaDurationSec <= 0 || endSec <= mediaDurationSec + 0.05)
  );
}
