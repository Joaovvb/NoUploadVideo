import { Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  ConvertPayload,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '../models/worker-message.model';

export interface ConversionProgressEvent {
  progress: number;
  status: string;
}

const LOAD_TIMEOUT_MS = 120_000;

/**
 * Spawns a Web Worker that runs createFFmpegCore off the main thread.
 * Uses multi-threaded core when Cross-Origin Isolation is enabled.
 */
@Injectable({ providedIn: 'root' })
export class WorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;

  private readonly progressSubject = new Subject<ConversionProgressEvent>();
  readonly progress$ = this.progressSubject.asObservable();

  /** True when FFmpeg core-mt (multi-threaded) is active */
  readonly isMultithreaded = signal(false);

  constructor(private readonly ngZone: NgZone) {}

  init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.spawnWorker().catch((error: unknown) => {
      this.initPromise = null;
      this.worker?.terminate();
      this.worker = null;
      throw error;
    });

    return this.initPromise;
  }

  convert(payload: ConvertPayload): Observable<ArrayBuffer> {
    return new Observable<ArrayBuffer>((subscriber) => {
      void this.init()
        .then(() => this.convertInWorker(payload, subscriber))
        .catch((error: unknown) => {
          subscriber.error(this.toError(error, 'Conversion failed'));
        });
    });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initPromise = null;
    this.progressSubject.complete();
  }

  private resolveCoreUrls(): { coreURL: string; wasmURL: string; workerURL?: string } {
    const origin = window.location.origin;
    const useMultithread = typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated;
    const base = useMultithread ? `${origin}/ffmpeg-mt` : `${origin}/ffmpeg`;

    return {
      coreURL: `${base}/ffmpeg-core.js`,
      wasmURL: `${base}/ffmpeg-core.wasm`,
      workerURL: useMultithread ? `${base}/ffmpeg-core.worker.js` : undefined,
    };
  }

  private spawnWorker(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(
          new URL('../workers/ffmpeg.worker', import.meta.url),
          { type: 'module' },
        );
      } catch (error) {
        reject(this.toError(error, 'Failed to create FFmpeg worker'));
        return;
      }

      const { coreURL, wasmURL, workerURL } = this.resolveCoreUrls();

      const initTimeout = setTimeout(() => {
        cleanup();
        reject(new Error('FFmpeg engine load timed out. Check your connection and reload the page.'));
      }, LOAD_TIMEOUT_MS);

      const onMessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        const { type, progress, status, error, multithreaded } = event.data;

        if (type === 'progress' && progress !== undefined) {
          this.emitProgress(progress, status ?? 'Processing…');
        }

        if (type === 'ready') {
          this.isMultithreaded.set(!!multithreaded);
          cleanup();
          resolve();
        }

        if (type === 'error') {
          cleanup();
          reject(new Error(error ?? 'Worker initialization failed'));
        }
      };

      const onError = (event: ErrorEvent) => {
        cleanup();
        this.worker?.terminate();
        this.worker = null;
        const detail = event.message?.trim();
        reject(new Error(
          detail
            ? `FFmpeg worker failed: ${detail}`
            : 'FFmpeg worker failed to load. Restart the dev server (npm start) and hard-refresh the page (Ctrl+Shift+R).',
        ));
      };

      const cleanup = (): void => {
        clearTimeout(initTimeout);
        this.worker?.removeEventListener('message', onMessage);
        this.worker?.removeEventListener('error', onError);
      };

      this.worker.addEventListener('message', onMessage);
      this.worker.addEventListener('error', onError);

      const message: WorkerInboundMessage = { type: 'init', coreURL, wasmURL, workerURL };
      this.worker.postMessage(message);
    });
  }

  private convertInWorker(
    payload: ConvertPayload,
    subscriber: { next: (value: ArrayBuffer) => void; complete: () => void; error: (err: Error) => void },
  ): void {
    if (!this.worker) {
      subscriber.error(new Error('Worker not initialized'));
      return;
    }

    const onMessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const { type, progress, status, data, error } = event.data;

      if (type === 'progress' && progress !== undefined) {
        this.emitProgress(progress, status ?? 'Processing…');
      }

      if (type === 'complete') {
        this.worker?.removeEventListener('message', onMessage);
        if (data) {
          subscriber.next(data);
          subscriber.complete();
        } else {
          subscriber.error(new Error('Worker returned empty result'));
        }
      }

      if (type === 'error') {
        this.worker?.removeEventListener('message', onMessage);
        subscriber.error(new Error(error ?? 'Conversion failed'));
      }
    };

    this.worker.addEventListener('message', onMessage);

    const message: WorkerInboundMessage = { type: 'convert', payload };
    this.worker.postMessage(message, [payload.fileData]);
  }

  private emitProgress(progress: number, status: string): void {
    const safeProgress = Number.isFinite(progress)
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : 0;

    this.ngZone.run(() => {
      this.progressSubject.next({ progress: safeProgress, status });
    });
  }

  private toError(error: unknown, fallback: string): Error {
    return error instanceof Error ? error : new Error(fallback);
  }
}
