export interface ConversionStrategy {
  label: string;
  args: string[];
  /** When true, FFmpeg progress events map to the main progress bar */
  tracksEncodeProgress: boolean;
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
): ConversionStrategy[] {
  const input = ['-i', inputName];

  if (outputFormat === 'mp3') {
    return [{
      label: 'Extracting audio…',
      tracksEncodeProgress: true,
      args: [...input, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputName],
    }];
  }

  if (outputFormat === 'mp4') {
    return [
      {
        label: 'Remux rápido (sem re-encode)…',
        tracksEncodeProgress: false,
        args: [...input, '-c', 'copy', ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Copiando vídeo, convertendo áudio…',
        tracksEncodeProgress: true,
        args: [...input, '-c:v', 'copy', ...FAST_AAC, ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Transcodificando vídeo (áudio original)…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, '-c:a', 'copy', ...MP4_FASTSTART, outputName],
      },
      {
        label: 'Transcodificando vídeo e áudio…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, ...FAST_AAC, ...MP4_FASTSTART, outputName],
      },
    ];
  }

  if (outputFormat === 'avi' || outputFormat === 'mkv' || outputFormat === 'mov') {
    return [
      {
        label: 'Remux rápido…',
        tracksEncodeProgress: false,
        args: [...input, '-c', 'copy', outputName],
      },
      {
        label: 'Transcodificando com preset rápido…',
        tracksEncodeProgress: true,
        args: [...input, ...FAST_H264, ...FAST_AAC, outputName],
      },
    ];
  }

  return [{
    label: 'Convertendo…',
    tracksEncodeProgress: true,
    args: [...input, outputName],
  }];
}
