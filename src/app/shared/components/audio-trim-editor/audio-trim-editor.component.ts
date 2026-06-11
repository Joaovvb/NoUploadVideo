import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AudioTrimRange,
  MIN_TRIM_DURATION_SEC,
  isValidTrimRange,
} from '../../../core/models/audio-trim-range.model';
import { areTrimRangesEqual } from '../../../core/utils/audio-trim-range.util';
import { formatTimeLabel } from '../../../core/utils/format-time.util';

@Component({
  selector: 'app-audio-trim-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="audio-trim" aria-labelledby="audio-trim-heading">
      <div class="audio-trim__header">
        <h3 id="audio-trim-heading" class="audio-trim__title">Trim audio (optional)</h3>
        <label class="audio-trim__toggle">
          <input
            type="checkbox"
            [disabled]="disabled()"
            [checked]="trimEnabled()"
            (change)="onTrimEnabledChange($any($event.target).checked)"
          />
          <span>Extract only a segment</span>
        </label>
      </div>

      @if (trimEnabled()) {
        @if (previewUrl()) {
          <video
            #previewVideo
            class="audio-trim__video"
            [src]="previewUrl()"
            controls
            preload="metadata"
            (loadedmetadata)="onMetadataLoaded(previewVideo)"
            (timeupdate)="onTimeUpdate(previewVideo.currentTime)"
          >
            Your browser cannot preview this file. You can still set start/end times below.
          </video>
        } @else {
          <p class="audio-trim__hint" role="status">Loading preview…</p>
        }

        @if (durationSec() > 0) {
          <p class="audio-trim__duration" aria-live="polite">
            Duration: {{ formatTime(durationSec()) }}
            · Selection: {{ formatTime(startSec()) }} – {{ formatTime(endSec()) }}
            ({{ formatTime(selectionDuration()) }})
          </p>

          <div class="audio-trim__markers">
            <button
              type="button"
              class="audio-trim__marker-btn"
              [disabled]="disabled()"
              (click)="setStartFromPlayhead()"
            >
              Set start from playhead
            </button>
            <button
              type="button"
              class="audio-trim__marker-btn"
              [disabled]="disabled()"
              (click)="setEndFromPlayhead()"
            >
              Set end from playhead
            </button>
          </div>

          <div class="audio-trim__slider-group">
            <label class="audio-trim__slider-label" for="trim-start">
              Start ({{ formatTime(startSec()) }})
            </label>
            <input
              id="trim-start"
              type="range"
              class="audio-trim__slider"
              [disabled]="disabled()"
              [min]="0"
              [max]="durationSec()"
              [step]="sliderStep()"
              [ngModel]="startSec()"
              (ngModelChange)="onStartChange($event)"
            />
          </div>

          <div class="audio-trim__slider-group">
            <label class="audio-trim__slider-label" for="trim-end">
              End ({{ formatTime(endSec()) }})
            </label>
            <input
              id="trim-end"
              type="range"
              class="audio-trim__slider"
              [disabled]="disabled()"
              [min]="0"
              [max]="durationSec()"
              [step]="sliderStep()"
              [ngModel]="endSec()"
              (ngModelChange)="onEndChange($event)"
            />
          </div>
        } @else if (previewUrl()) {
          <p class="audio-trim__hint" role="note">
            Preview duration unavailable — wait for metadata or use the playhead buttons after the video loads.
          </p>
        }

        @if (validationMessage()) {
          <p class="audio-trim__error" role="alert">{{ validationMessage() }}</p>
        }
      }
    </section>
  `,
  styleUrl: './audio-trim-editor.component.scss',
})
export class AudioTrimEditorComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly file = input.required<File>();
  readonly disabled = input(false);
  readonly trimRange = input<AudioTrimRange | null>(null);

  readonly trimRangeChange = output<AudioTrimRange | null>();

  readonly trimEnabled = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly durationSec = signal(0);
  readonly startSec = signal(0);
  readonly endSec = signal(0);
  readonly playheadSec = signal(0);
  readonly validationMessage = signal<string | null>(null);

  private loadedFile: File | null = null;
  private metadataApplied = false;

  readonly formatTime = formatTimeLabel;

  readonly selectionDuration = computed(() => Math.max(0, this.endSec() - this.startSec()));

  readonly sliderStep = computed(() => (this.durationSec() > 600 ? 1 : 0.1));

  constructor() {
    effect(() => {
      const file = this.file();
      if (this.loadedFile === file) {
        return;
      }

      this.resetForFile(file);
    });

    effect(() => {
      if (!this.trimEnabled()) {
        this.revokePreview();
        this.metadataApplied = false;
        return;
      }

      this.ensurePreviewUrl(this.file());
    });

    this.destroyRef.onDestroy(() => this.revokePreview());
  }

  onTrimEnabledChange(enabled: boolean): void {
    this.trimEnabled.set(enabled);

    if (!enabled) {
      this.validationMessage.set(null);
      this.emitTrimIfValid();
      return;
    }

    const duration = this.durationSec();
    if (duration > 0 && this.endSec() <= this.startSec()) {
      this.startSec.set(0);
      this.endSec.set(duration);
    }

    this.emitTrimIfValid();
  }

  onMetadataLoaded(video: HTMLVideoElement): void {
    if (this.metadataApplied) {
      return;
    }

    this.metadataApplied = true;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    this.durationSec.set(duration);

    const existing = this.trimRange();
    if (existing && isValidTrimRange(existing, duration)) {
      this.startSec.set(existing.startSec);
      this.endSec.set(existing.endSec);
    } else if (duration > 0) {
      this.startSec.set(0);
      this.endSec.set(duration);
    }

    this.emitTrimIfValid();
  }

  onTimeUpdate(currentTime: number): void {
    if (Number.isFinite(currentTime)) {
      this.playheadSec.set(currentTime);
    }
  }

  setStartFromPlayhead(): void {
    const time = this.playheadSec();
    const end = this.endSec();
    const maxStart = Math.max(0, end - MIN_TRIM_DURATION_SEC);
    this.startSec.set(Math.min(time, maxStart));
    this.emitTrimIfValid();
  }

  setEndFromPlayhead(): void {
    const time = this.playheadSec();
    const start = this.startSec();
    const duration = this.durationSec();
    const minEnd = start + MIN_TRIM_DURATION_SEC;
    const capped = duration > 0 ? Math.min(time, duration) : time;
    this.endSec.set(Math.max(capped, minEnd));
    this.emitTrimIfValid();
  }

  onStartChange(value: number): void {
    const end = this.endSec();
    const maxStart = Math.max(0, end - MIN_TRIM_DURATION_SEC);
    this.startSec.set(Math.min(value, maxStart));
    this.emitTrimIfValid();
  }

  onEndChange(value: number): void {
    const start = this.startSec();
    const duration = this.durationSec();
    const minEnd = start + MIN_TRIM_DURATION_SEC;
    let nextEnd = Math.max(value, minEnd);
    if (duration > 0) {
      nextEnd = Math.min(nextEnd, duration);
    }
    this.endSec.set(nextEnd);
    this.emitTrimIfValid();
  }

  private resetForFile(file: File): void {
    this.revokePreview();
    this.metadataApplied = false;
    this.loadedFile = file;
    this.durationSec.set(0);
    this.validationMessage.set(null);

    const existing = this.trimRange();
    this.trimEnabled.set(!!existing);
    if (existing) {
      this.startSec.set(existing.startSec);
      this.endSec.set(existing.endSec);
    } else {
      this.startSec.set(0);
      this.endSec.set(0);
    }
  }

  private ensurePreviewUrl(file: File): void {
    if (this.previewUrl() && this.loadedFile === file) {
      return;
    }

    this.revokePreview();
    this.metadataApplied = false;
    this.loadedFile = file;
    this.previewUrl.set(URL.createObjectURL(file));
  }

  private emitTrimIfValid(): void {
    const nextRange = this.resolveTrimRange();

    if (areTrimRangesEqual(nextRange, this.trimRange())) {
      return;
    }

    if (!nextRange && !this.trimEnabled()) {
      this.validationMessage.set(null);
      this.trimRangeChange.emit(null);
      return;
    }

    if (!nextRange) {
      this.validationMessage.set(
        `Select at least ${MIN_TRIM_DURATION_SEC}s between start and end.`,
      );
      this.trimRangeChange.emit(null);
      return;
    }

    this.validationMessage.set(null);
    this.trimRangeChange.emit(nextRange);
  }

  private resolveTrimRange(): AudioTrimRange | null {
    if (!this.trimEnabled()) {
      return null;
    }

    const range: AudioTrimRange = {
      startSec: this.startSec(),
      endSec: this.endSec(),
    };

    const duration = this.durationSec();

    if (!isValidTrimRange(range, duration)) {
      return null;
    }

    if (duration > 0 && range.startSec <= 0.05 && range.endSec >= duration - 0.05) {
      return null;
    }

    return range;
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set(null);
    }
  }
}
