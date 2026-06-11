/** Supported video/audio container and codec extensions */
export type VideoFormat = 'mp4' | 'avi' | 'mkv' | 'mov' | 'webm';
export type OutputFormat = VideoFormat | 'mp3';
export type InputFormat = VideoFormat | 'mp3';

export interface FormatOption {
  value: OutputFormat;
  label: string;
}

export interface ConversionPreset {
  inputFormat?: InputFormat;
  outputFormat: OutputFormat;
  pageTitle: string;
  pageDescription: string;
}
