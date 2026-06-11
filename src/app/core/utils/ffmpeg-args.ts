import { AudioTrimRange } from '../models/audio-trim-range.model';

export interface ConversionStrategy {
  label: string;
  args: string[];
  /** When true, FFmpeg progress events map to the main progress bar */
  tracksEncodeProgress: boolean;
}

function buildTrimArgs(trim?: AudioTrimRange): string[] {
  if (!trim) {
    return [];
  }

  return ['-ss', String(trim.startSec), '-to', String(trim.endSec)];
}

const MP4_FASTSTART = ['-movflags', '+faststart'];

const FAST_H264 = [
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-tune', 'zerolatency',
  '-crf', '28',
  '-pix_fmt', 'yuv420p',
];

const FAST_AAC = ['-c:a', 'aac', '-b:a', '128k'];

/** FFmpeg strategies ordered fastest → most compatible */
export function buildConversionStrategies(
  inputName: string,
  outputName: string,
  outputFormat: string,
  trim?: AudioTrimRange,
): ConversionStrategy[] {
  const input = ['-i', inputName];
  const trimArgs = buildTrimArgs(trim);

  if (outputFormat === 'mp3') {
    const label = trim ? 'Extracting audio segment…' : 'Extracting audio…';
    return [{
      label,
      tracksEncodeProgress: true,
      args: [...input, ...trimArgs, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputName],
    }];
  }

  if (outputFormat === 'mp4') {
    return [
      {
        label: 'Fast remux (no re-encode)…',
        tracksEncodeProgress: false,
        args: [...input, '-c', 'copy', ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Copying video, converting audio…',
        tracksEncodeProgress: true,
        args: [...input, '-c:v', 'copy', ...FAST_AAC, ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Transcoding video (original audio)…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, '-c:a', 'copy', ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Transcoding video and audio…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, ...FAST_AAC, ...MP4_FASTSTART, outputName],
      },
    ];
  }

  if (outputFormat === 'avi' || outputFormat === 'mkv' || outputFormat === 'mov') {
    return [
      {
        label: 'Fast remux…',
        tracksEncodeProgress: false,
        args: [...input, '-c', 'copy', outputName],
      },
      {
        label: 'Transcoding with fast preset…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, ...FAST_AAC, outputName],
      },
    ];
  }

  return [{
    label: 'Converting…',
    tracksEncodeProgress: true,
    args: [...input, outputName],
  }];
}
