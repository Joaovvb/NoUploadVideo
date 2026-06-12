import { CONTACT_EMAIL } from '../constants/contact.constants';

export interface IssueReportContext {
  fileName: string;
  outputFormat: string;
  errorMessage: string;
  fileSizeLabel?: string;
  hadTrimSegment?: boolean;
}

export type FeedbackMailtoKind = 'general' | 'positive';

function buildMailtoUrl(subject: string, bodyLines: string[]): string {
  const body = bodyLines.join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function browserLine(userAgent?: string): string {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return ua ? `Browser: ${ua}` : 'Browser: (unknown)';
}

export function buildFeedbackMailtoUrl(
  kind: FeedbackMailtoKind = 'general',
  userAgent?: string,
): string {
  const subject =
    kind === 'positive' ? 'NoUploadVideo — thanks / positive feedback' : 'NoUploadVideo — feedback';

  const bodyLines =
    kind === 'positive'
      ? [
          'NoUploadVideo worked well for me.',
          '',
          'What I converted (optional):',
          '',
          browserLine(userAgent),
        ]
      : [
          'My feedback:',
          '',
          '(What worked, what did not, or what you would like to see)',
          '',
          browserLine(userAgent),
        ];

  return buildMailtoUrl(subject, bodyLines);
}

export function buildIssueReportMailtoUrl(
  context: IssueReportContext,
  userAgent?: string,
): string {
  const subject = `NoUploadVideo — conversion issue — ${context.fileName}`;

  const bodyLines = [
    'Something went wrong during conversion.',
    '',
    `File: ${context.fileName}`,
    `Output format: ${context.outputFormat.toUpperCase()}`,
    context.fileSizeLabel ? `File size: ${context.fileSizeLabel}` : '',
    context.hadTrimSegment ? 'MP3 trim segment: yes' : '',
    `Error: ${context.errorMessage}`,
    '',
    'What I expected:',
    '',
    browserLine(userAgent),
  ].filter((line) => line.length > 0);

  return buildMailtoUrl(subject, bodyLines);
}
