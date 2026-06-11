import { extractAudioWaveformPeaks } from './audio-waveform.util';

describe('extractAudioWaveformPeaks', () => {
  it('should reject non-audio data', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'invalid.bin', {
      type: 'application/octet-stream',
    });

    await expectAsync(extractAudioWaveformPeaks(file, 8)).toBeRejected();
  });
});
