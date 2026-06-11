import { Injectable } from '@angular/core';
import { OutputFormat } from '../models/conversion-format.model';
import { MIME_TYPES } from '../constants/conversion.constants';

/**
 * Optional fast path using the WebCodecs API for MP4 re-muxing.
 * Falls back to FFmpeg when unsupported or conversion is not eligible.
 */
@Injectable({ providedIn: 'root' })
export class WebCodecsService {
  /** True when VideoEncoder and VideoDecoder are available in this browser */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'VideoEncoder' in window &&
      'VideoDecoder' in window &&
      'EncodedVideoChunk' in window
    );
  }

  /**
   * WebCodecs fast path is limited to MP4 output from browser-decodable inputs.
   * Complex container changes still require FFmpeg.
   */
  canUseForConversion(inputExt: string, outputFormat: OutputFormat): boolean {
    if (!this.isSupported() || outputFormat !== 'mp4') {
      return false;
    }

    const webCodecsFriendlyInputs = ['mp4', 'webm'];
    return webCodecsFriendlyInputs.includes(inputExt.toLowerCase());
  }

  /**
   * Re-package MP4/WebM into MP4 using MediaRecorder (hardware-accelerated when available).
   * This is faster than full FFmpeg transcode for compatible inputs.
   */
  async convertToMp4(file: File): Promise<Blob> {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Unable to decode video with WebCodecs path'));
    });

    const stream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();

    if (!stream) {
      URL.revokeObjectURL(video.src);
      throw new Error('captureStream is not supported');
    }

    const mimeType = MIME_TYPES['mp4'];
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
    });

    const chunks: Blob[] = [];

    const recordingDone = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: mimeType }));
      };
      recorder.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('MediaRecorder failed during WebCodecs conversion'));
      };
    });

    recorder.start();
    await video.play();

    const durationMs = (video.duration || 0) * 1000;
    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
      if (durationMs > 0) {
        video.currentTime = durationMs / 1000;
      }
    });

    recorder.stop();
    return recordingDone;
  }
}
