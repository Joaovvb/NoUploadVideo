import { CONTACT_EMAIL } from '../constants/contact.constants';
import {
  buildFeedbackMailtoUrl,
  buildIssueReportMailtoUrl,
} from './feedback-mailto.util';

describe('feedback-mailto.util', () => {
  const testUserAgent = 'TestBrowser/1.0';

  it('should build general feedback mailto', () => {
    const url = buildFeedbackMailtoUrl('general', testUserAgent);

    expect(url.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBeTrue();
    expect(decodeURIComponent(url)).toContain('NoUploadVideo — feedback');
    expect(decodeURIComponent(url)).toContain(testUserAgent);
  });

  it('should build positive feedback mailto', () => {
    const url = buildFeedbackMailtoUrl('positive', testUserAgent);

    expect(decodeURIComponent(url)).toContain('positive feedback');
    expect(decodeURIComponent(url)).toContain('worked well');
  });

  it('should build issue report mailto with context', () => {
    const url = buildIssueReportMailtoUrl(
      {
        fileName: 'clip.mp4',
        outputFormat: 'mp3',
        errorMessage: 'FFmpeg failed',
        fileSizeLabel: '12.5 MB',
        hadTrimSegment: true,
      },
      testUserAgent,
    );

    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('clip.mp4');
    expect(decoded).toContain('MP3');
    expect(decoded).toContain('FFmpeg failed');
    expect(decoded).toContain('12.5 MB');
    expect(decoded).toContain('MP3 trim segment: yes');
    expect(decoded).toContain(testUserAgent);
  });
});
