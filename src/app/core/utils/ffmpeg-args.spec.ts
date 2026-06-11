import { buildConversionStrategies } from './ffmpeg-args';

describe('buildConversionStrategies', () => {
  it('should include trim args for mp3 extraction', () => {
    const startSec = 12.5;
    const endSec = 45;

    const [strategy] = buildConversionStrategies('input.avi', 'output.mp3', 'mp3', {
      startSec,
      endSec,
    });

    expect(strategy.args).toContain('-ss');
    expect(strategy.args).toContain(String(startSec));
    expect(strategy.args).toContain('-to');
    expect(strategy.args).toContain(String(endSec));
    expect(strategy.args).toContain('-acodec');
    expect(strategy.args).toContain('libmp3lame');
  });

  it('should not include trim args for mp3 without trim range', () => {
    const [strategy] = buildConversionStrategies('input.mp4', 'output.mp3', 'mp3');

    expect(strategy.args).not.toContain('-ss');
    expect(strategy.args).not.toContain('-to');
  });
});
