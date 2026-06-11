import { FormatOption } from '../models/conversion-format.model';

/** Maximum upload size: 200 MB */
export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

/** Extensions accepted for upload */
export const SUPPORTED_INPUT_EXTENSIONS = [
  'avi',
  'mp4',
  'mkv',
  'mov',
  'webm',
  'mp3',
] as const;

export const OUTPUT_FORMAT_OPTIONS: FormatOption[] = [
  { value: 'mp4', label: 'MP4 (H.264)' },
  { value: 'avi', label: 'AVI' },
  { value: 'mkv', label: 'MKV' },
  { value: 'mov', label: 'MOV' },
  { value: 'mp3', label: 'MP3 (audio only)' },
];

export const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
};
