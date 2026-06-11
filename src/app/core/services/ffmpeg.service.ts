import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MIME_TYPES } from '../constants/conversion.constants';
import { OutputFormat } from '../models/conversion-format.model';
import { ConversionResult } from '../models/conversion-result.model';
import { WebCodecsService } from './webcodecs.service';
import { WorkerService } from './worker.service';

/**
 * High-level conversion API.
 * Chooses WebCodecs fast path when possible, otherwise delegates to FFmpeg via WorkerService.
 */
@Injectable({ providedIn: 'root' })
export class FfmpegService {
  private initialized = false;

  constructor(
    private readonly workerService: WorkerService,
    private readonly webCodecsService: WebCodecsService,
  ) {}

  /** Lazy singleton initialization — loads FFmpeg WASM once */
  async init(): Promise<void> {
    if (!this.initialized) {
      await this.workerService.init();
      this.initialized = true;
    }
  }

  get isWebCodecsSupported(): boolean {
    return this.webCodecsService.isSupported();
  }

  get isMultithreaded(): boolean {
    return this.workerService.isMultithreaded();
  }

  /**
   * Convert a local file to the target format and return a Blob URL for download.
   * Command equivalent: ffmpeg -i input.ext output.<format>
   */
  async convert(file: File, outputFormat: OutputFormat): Promise<ConversionResult> {
    const inputExt = getFileExtension(file.name);

    if (this.webCodecsService.canUseForConversion(inputExt, outputFormat)) {
      try {
        const blob = await this.webCodecsService.convertToMp4(file);
        return this.fromBlob(blob, MIME_TYPES['mp4']);
      } catch {
        // Fall through to FFmpeg on WebCodecs failure
      }
    }

    await this.init();

    const fileData = await file.arrayBuffer();
    const resultBuffer = await firstValueFrom(
      this.workerService.convert({
        fileData,
        inputExt,
        outputFormat,
      }),
    );

    const mimeType = MIME_TYPES[outputFormat] ?? 'application/octet-stream';
    const data = new Uint8Array(resultBuffer);
    return this.fromBytes(data, mimeType);
  }

  /** Stream conversion progress (0–100) from the worker */
  get progress$() {
    return this.workerService.progress$;
  }

  private fromBytes(data: Uint8Array, mimeType: string): ConversionResult {
    const blob = new Blob([data], { type: mimeType });
    return {
      blob,
      data,
      url: URL.createObjectURL(blob),
    };
  }

  private async fromBlob(blob: Blob, mimeType: string): Promise<ConversionResult> {
    const buffer = await blob.arrayBuffer();
    return this.fromBytes(new Uint8Array(buffer), mimeType);
  }
}

/** Extract lowercase extension without the dot */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}
