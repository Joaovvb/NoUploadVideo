import { AudioTrimRange } from '../models/audio-trim-range.model';

export function areTrimRangesEqual(
  a: AudioTrimRange | null | undefined,
  b: AudioTrimRange | null | undefined,
): boolean {
  if (!a && !b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a.startSec === b.startSec && a.endSec === b.endSec;
}
