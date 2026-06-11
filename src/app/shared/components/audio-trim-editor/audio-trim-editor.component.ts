import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AudioTrimRange,
  MIN_TRIM_DURATION_SEC,
  isValidTrimRange,
} from '../../../core/models/audio-trim-range.model';
import { areTrimRangesEqual } from '../../../core/utils/audio-trim-range.util';
import { AudioWaveformTrimComponent } from '../audio-waveform-trim/audio-waveform-trim.component';

@Component({
  selector: 'app-audio-trim-editor',
  standalone: true,
  imports: [CommonModule, AudioWaveformTrimComponent],
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
          <app-audio-waveform-trim
            [file]="file()"
            [mediaUrl]="previewUrl()"
            [disabled]="disabled()"
            [durationSec]="durationSec()"
            [startSec]="startSec()"
            [endSec]="endSec()"
            (durationSecChange)="onDurationLoaded($event)"
            (startSecChange)="onStartChange($event)"
            (endSecChange)="onEndChange($event)"
          />
        } @else {
          <p class="audio-trim__hint" role="status">Loading preview…</p>
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
  readonly validationMessage = signal<string | null>(null);

  private loadedFile: File | null = null;
  private rangeInitialized = false;

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
        this.rangeInitialized = false;
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

  onDurationLoaded(duration: number): void {
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const previousDuration = this.durationSec();
    this.durationSec.set(duration);

    if (this.rangeInitialized && previousDuration > 0) {
      this.emitTrimIfValid();
      return;
    }

    this.rangeInitialized = true;
    const existing = this.trimRange();

    if (existing && isValidTrimRange(existing, duration)) {
      this.startSec.set(existing.startSec);
      this.endSec.set(existing.endSec);
    } else {
      this.startSec.set(0);
      this.endSec.set(duration);
    }

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
    this.rangeInitialized = false;
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
    this.rangeInitialized = false;
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
