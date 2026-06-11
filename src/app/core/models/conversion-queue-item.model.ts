import { AudioTrimRange } from './audio-trim-range.model';
import { OutputFormat } from './conversion-format.model';

export type ConversionQueueStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface ConversionQueueItem {
  id: string;
  file: File;
  inputFormat: string;
  outputFormat: OutputFormat;
  status: ConversionQueueStatus;
  progress: number;
  statusText: string | null;
  outputUrl: string | null;
  /** Bytes de saída (cópia estável para ZIP / salvar em pasta) */
  outputData: Uint8Array | null;
  errorMessage: string | null;
  downloaded: boolean;
  /** Optional segment for MP3 extraction */
  trimRange: AudioTrimRange | null;
}
