export interface AudioWaveformData {
  peaks: number[];
  durationSec: number;
}

const DEFAULT_BAR_COUNT = 180;

/** Downsamples audio amplitude into normalized peaks for canvas rendering. */
export async function extractAudioWaveformPeaks(
  file: File,
  barCount = DEFAULT_BAR_COUNT,
): Promise<AudioWaveformData> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const durationSec = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.max(1, Math.floor(channelData.length / barCount));
    const peaks: number[] = [];

    for (let barIndex = 0; barIndex < barCount; barIndex++) {
      const start = barIndex * samplesPerBar;
      const end = Math.min(start + samplesPerBar, channelData.length);
      let peak = 0;

      for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
        peak = Math.max(peak, Math.abs(channelData[sampleIndex]));
      }

      peaks.push(peak);
    }

    const maxPeak = Math.max(...peaks, 0.001);
    return {
      peaks: peaks.map((value) => value / maxPeak),
      durationSec,
    };
  } finally {
    await audioContext.close();
  }
}
