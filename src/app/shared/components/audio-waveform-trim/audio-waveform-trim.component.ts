import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MIN_TRIM_DURATION_SEC } from '../../../core/models/audio-trim-range.model';
import { extractAudioWaveformPeaks } from '../../../core/utils/audio-waveform.util';
import { formatTimeLabel } from '../../../core/utils/format-time.util';

type DragHandle = 'start' | 'end' | 'playhead';

@Component({
  selector: 'app-audio-waveform-trim',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="waveform-trim">
      <p class="waveform-trim__label">Preview</p>

      @if (isLoading()) {
        <p class="waveform-trim__loading" role="status">Generating waveform…</p>
      } @else if (loadError()) {
        <p class="waveform-trim__fallback" role="note">{{ loadError() }}</p>
        @if (durationSec() > 0) {
          <div class="waveform-trim__fallback-sliders">
            <label class="waveform-trim__fallback-label" for="trim-fallback-start">
              Start ({{ formatTime(startSec()) }})
            </label>
            <input
              id="trim-fallback-start"
              type="range"
              class="waveform-trim__fallback-slider"
              [disabled]="disabled()"
              [min]="0"
              [max]="durationSec()"
              [step]="sliderStep()"
              [ngModel]="startSec()"
              (ngModelChange)="startSecChange.emit($event)"
            />
            <label class="waveform-trim__fallback-label" for="trim-fallback-end">
              End ({{ formatTime(endSec()) }})
            </label>
            <input
              id="trim-fallback-end"
              type="range"
              class="waveform-trim__fallback-slider"
              [disabled]="disabled()"
              [min]="0"
              [max]="durationSec()"
              [step]="sliderStep()"
              [ngModel]="endSec()"
              (ngModelChange)="endSecChange.emit($event)"
            />
          </div>
        }
      } @else if (peaks().length > 0) {
        <div class="waveform-trim__panel">
          <button
            type="button"
            class="waveform-trim__play"
            [disabled]="disabled() || !mediaUrl()"
            [attr.aria-label]="isPlaying() ? 'Pause selection preview' : 'Play selected segment'"
            (click)="togglePlayback()"
          >
            <span class="waveform-trim__play-icon" aria-hidden="true">{{ isPlaying() ? '❚❚' : '▶' }}</span>
          </button>

          <div class="waveform-trim__canvas-wrap">
            <canvas
              #waveCanvas
              class="waveform-trim__canvas"
              role="slider"
              aria-label="Audio trim selection"
              [attr.aria-valuemin]="0"
              [attr.aria-valuemax]="durationSec()"
              [attr.aria-valuenow]="startSec()"
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointercancel)="onPointerUp($event)"
              (pointerleave)="onPointerUp($event)"
            ></canvas>
          </div>
        </div>
      }

      <audio
        #previewAudio
        class="waveform-trim__media"
        [src]="mediaUrl() ?? undefined"
        preload="auto"
        (loadedmetadata)="onMediaMetadataLoaded()"
        (timeupdate)="onMediaTimeUpdate()"
        (ended)="finishSegmentPlayback()"
      ></audio>

      @if (durationSec() > 0) {
        <div class="waveform-trim__meta">
          <span>Duration: {{ formatTime(durationSec()) }}</span>
          <span>Selection: {{ formatTime(startSec()) }} – {{ formatTime(endSec()) }}</span>
          <span>({{ formatSelectionDuration() }})</span>
        </div>
      }
    </div>
  `,
  styleUrl: './audio-waveform-trim.component.scss',
})
export class AudioWaveformTrimComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly file = input.required<File>();
  readonly mediaUrl = input<string | null>(null);
  readonly disabled = input(false);
  readonly durationSec = input(0);
  readonly startSec = input(0);
  readonly endSec = input(0);

  readonly startSecChange = output<number>();
  readonly endSecChange = output<number>();
  readonly playheadSecChange = output<number>();
  readonly durationSecChange = output<number>();

  readonly waveCanvas = viewChild<ElementRef<HTMLCanvasElement>>('waveCanvas');
  readonly previewAudio = viewChild<ElementRef<HTMLAudioElement>>('previewAudio');

  readonly peaks = signal<number[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isPlaying = signal(false);
  readonly playheadSec = signal(0);

  readonly formatTime = formatTimeLabel;

  readonly sliderStep = computed(() => (this.durationSec() > 600 ? 1 : 0.1));

  private activeHandle: DragHandle | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private loadedFile: File | null = null;
  private playbackFrameId: number | null = null;

  constructor() {
    effect(() => {
      const file = this.file();
      if (this.loadedFile === file) {
        return;
      }

      this.loadedFile = file;
      void this.loadWaveform(file);
    });

    effect(() => {
      this.startSec();
      this.endSec();
      this.durationSec();
      this.peaks();
      this.playheadSec();
      this.drawWaveform();
    });

    effect(() => {
      this.startSec();
      this.endSec();

      if (untracked(() => this.isPlaying())) {
        this.pauseSegmentPlayback();
      }
    });

    afterNextRender(() => {
      const canvas = this.waveCanvas()?.nativeElement;
      if (!canvas) {
        return;
      }

      this.resizeObserver = new ResizeObserver(() => this.drawWaveform());
      this.resizeObserver.observe(canvas);
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.cancelPlaybackMonitor();
      this.stopPlayback();
    });
  }

  formatSelectionDuration(): string {
    const seconds = Math.max(0, this.endSec() - this.startSec());
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }

    return formatTimeLabel(seconds);
  }

  togglePlayback(): void {
    const media = this.previewAudio()?.nativeElement;
    if (!media || this.disabled()) {
      return;
    }

    if (this.isPlaying()) {
      this.pauseSegmentPlayback();
      return;
    }

    void this.playSelectedSegment();
  }

  onMediaMetadataLoaded(): void {
    const media = this.previewAudio()?.nativeElement;
    if (!media || !Number.isFinite(media.duration)) {
      return;
    }

    if (this.durationSec() <= 0) {
      this.durationSecChange.emit(media.duration);
    }
  }

  onMediaTimeUpdate(): void {
    const media = this.previewAudio()?.nativeElement;
    if (!media) {
      return;
    }

    this.syncPlayhead(media.currentTime);
  }

  finishSegmentPlayback(): void {
    const media = this.previewAudio()?.nativeElement;
    const start = this.startSec();

    media?.pause();
    if (media) {
      media.currentTime = start;
    }

    this.syncPlayhead(start);
    this.isPlaying.set(false);
    this.cancelPlaybackMonitor();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.durationSec() <= 0) {
      return;
    }

    const offsetX = this.pointerOffsetX(event);
    const handle = this.resolveHandleAt(offsetX);
    this.activeHandle = handle;
    this.waveCanvas()?.nativeElement.setPointerCapture(event.pointerId);
    this.applyPointerPosition(offsetX, handle);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.activeHandle) {
      return;
    }

    this.applyPointerPosition(this.pointerOffsetX(event), this.activeHandle);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.activeHandle) {
      return;
    }

    this.activeHandle = null;
    this.waveCanvas()?.nativeElement.releasePointerCapture(event.pointerId);
  }

  private async loadWaveform(file: File): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.peaks.set([]);

    try {
      const data = await extractAudioWaveformPeaks(file);
      this.peaks.set(data.peaks);

      if (this.durationSec() <= 0) {
        this.durationSecChange.emit(data.durationSec);
      }
    } catch {
      this.loadError.set('Waveform preview unavailable for this file.');
      this.peaks.set([]);
    } finally {
      this.isLoading.set(false);
      this.drawWaveform();
    }
  }

  private drawWaveform(): void {
    const canvas = this.waveCanvas()?.nativeElement;
    const peaks = this.peaks();
    const duration = this.durationSec();

    if (!canvas || peaks.length === 0 || duration <= 0) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const startRatio = this.startSec() / duration;
    const endRatio = this.endSec() / duration;
    const barWidth = width / peaks.length;
    const centerY = height / 2;

    for (let index = 0; index < peaks.length; index++) {
      const ratio = (index + 0.5) / peaks.length;
      const barHeight = Math.max(2, peaks[index] * (height - 10));
      const x = index * barWidth;
      const inSelection = ratio >= startRatio && ratio <= endRatio;

      ctx.fillStyle = inSelection ? '#f8fafc' : 'rgba(148, 163, 184, 0.45)';
      ctx.fillRect(x + 0.5, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    }

    const startX = startRatio * width;
    const endX = endRatio * width;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

    this.drawHandle(ctx, startX, height, '#c7d2fe');
    this.drawHandle(ctx, endX, height, '#c7d2fe');

    const playheadRatio = this.playheadSec() / duration;
    if (playheadRatio > 0 && playheadRatio <= 1) {
      const playheadX = playheadRatio * width;
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, height: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x - 1.5, 0, 3, height);
  }

  private resolveHandleAt(offsetX: number): DragHandle {
    const canvas = this.waveCanvas()?.nativeElement;
    const duration = this.durationSec();

    if (!canvas || duration <= 0) {
      return 'playhead';
    }

    const width = canvas.clientWidth;
    const startX = (this.startSec() / duration) * width;
    const endX = (this.endSec() / duration) * width;
    const hit = 14;

    if (Math.abs(offsetX - startX) <= hit) {
      return 'start';
    }

    if (Math.abs(offsetX - endX) <= hit) {
      return 'end';
    }

    return 'playhead';
  }

  private applyPointerPosition(offsetX: number, handle: DragHandle): void {
    const canvas = this.waveCanvas()?.nativeElement;
    const duration = this.durationSec();

    if (!canvas || duration <= 0) {
      return;
    }

    const width = canvas.clientWidth;
    const ratio = Math.min(1, Math.max(0, offsetX / width));
    const time = ratio * duration;

    if (handle === 'start') {
      const maxStart = Math.max(0, this.endSec() - MIN_TRIM_DURATION_SEC);
      this.startSecChange.emit(Math.min(time, maxStart));
      return;
    }

    if (handle === 'end') {
      const minEnd = this.startSec() + MIN_TRIM_DURATION_SEC;
      this.endSecChange.emit(Math.max(time, minEnd));
      return;
    }

    const media = this.previewAudio()?.nativeElement;
    if (media) {
      const clamped = Math.min(this.endSec(), Math.max(this.startSec(), time));
      media.currentTime = clamped;
      this.syncPlayhead(clamped);
    }
  }

  private async playSelectedSegment(): Promise<void> {
    const media = this.previewAudio()?.nativeElement;
    if (!media) {
      return;
    }

    const start = this.startSec();
    const end = this.endSec();

    if (end <= start) {
      return;
    }

    media.pause();
    this.isPlaying.set(false);
    this.cancelPlaybackMonitor();

    try {
      await this.waitForMediaReady(media);
      await this.seekMediaTo(media, start);
      this.syncPlayhead(start);

      await media.play();
      this.isPlaying.set(true);
      this.startSegmentPlaybackMonitor();
    } catch {
      this.isPlaying.set(false);
      this.cancelPlaybackMonitor();
    }
  }

  private pauseSegmentPlayback(): void {
    const media = this.previewAudio()?.nativeElement;
    media?.pause();
    this.isPlaying.set(false);
    this.cancelPlaybackMonitor();
  }

  private startSegmentPlaybackMonitor(): void {
    this.cancelPlaybackMonitor();

    const tick = (): void => {
      const media = this.previewAudio()?.nativeElement;
      if (!media || !this.isPlaying()) {
        this.playbackFrameId = null;
        return;
      }

      const start = this.startSec();
      const end = this.endSec();
      const current = media.currentTime;

      if (media.paused) {
        this.playbackFrameId = requestAnimationFrame(tick);
        return;
      }

      if (current < start - 0.05) {
        void this.seekMediaTo(media, start);
        this.syncPlayhead(start);
      } else if (current >= end - 0.02) {
        this.finishSegmentPlayback();
        return;
      } else {
        this.syncPlayhead(current);
      }

      this.playbackFrameId = requestAnimationFrame(tick);
    };

    this.playbackFrameId = requestAnimationFrame(tick);
  }

  private waitForMediaReady(media: HTMLMediaElement): Promise<void> {
    if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onReady = (): void => {
        cleanup();
        resolve();
      };

      const onError = (): void => {
        cleanup();
        reject(new Error('Preview media failed to load'));
      };

      const cleanup = (): void => {
        media.removeEventListener('canplay', onReady);
        media.removeEventListener('error', onError);
      };

      media.addEventListener('canplay', onReady);
      media.addEventListener('error', onError);

      if (media.readyState === HTMLMediaElement.HAVE_NOTHING) {
        media.load();
      }
    });
  }

  private seekMediaTo(media: HTMLMediaElement, time: number): Promise<void> {
    if (Math.abs(media.currentTime - time) < 0.05) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onSeeked = (): void => {
        media.removeEventListener('seeked', onSeeked);
        resolve();
      };

      media.addEventListener('seeked', onSeeked);
      media.currentTime = time;
    });
  }

  private cancelPlaybackMonitor(): void {
    if (this.playbackFrameId !== null) {
      cancelAnimationFrame(this.playbackFrameId);
      this.playbackFrameId = null;
    }
  }

  private syncPlayhead(time: number): void {
    if (!Number.isFinite(time)) {
      return;
    }

    this.playheadSec.set(time);
    this.playheadSecChange.emit(time);
  }

  private stopPlayback(): void {
    this.pauseSegmentPlayback();
  }

  private pointerOffsetX(event: PointerEvent): number {
    const canvas = this.waveCanvas()?.nativeElement;
    if (!canvas) {
      return 0;
    }

    const rect = canvas.getBoundingClientRect();
    return Math.min(rect.width, Math.max(0, event.clientX - rect.left));
  }
}
