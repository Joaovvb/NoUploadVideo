import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  input,
  model,
  OnInit,
} from '@angular/core';
import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_INPUT_EXTENSIONS,
} from '../../core/constants/conversion.constants';
import { ZIP_BATCH_SIZE } from '../../core/constants/download.constants';
import { OutputFormat } from '../../core/models/conversion-format.model';
import { ConversionQueueService } from '../../core/services/conversion-queue.service';
import { FfmpegService, getFileExtension } from '../../core/services/ffmpeg.service';
import { ConversionQueueComponent } from '../../shared/components/conversion-queue/conversion-queue.component';
import { FormatSelectorComponent } from '../../shared/components/format-selector/format-selector.component';
import { UploadComponent } from '../../shared/components/upload/upload.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [
    CommonModule,
    UploadComponent,
    ConversionQueueComponent,
    FormatSelectorComponent,
    FileSizePipe,
  ],
  template: `
    <section class="converter" [attr.aria-labelledby]="showHeader() ? 'converter-heading' : null">
      @if (showHeader()) {
        <header class="converter__header">
          <h2 id="converter-heading" class="converter__title">{{ heading() }}</h2>
          @if (description()) {
            <p class="converter__description">{{ description() }}</p>
          }
        </header>
      }

      <div class="converter__badges">
        <p class="converter__privacy" role="note">
          <span class="converter__privacy-icon" aria-hidden="true">🔒</span>
          Processing locally — no upload
        </p>
        @if (ffmpegService.isMultithreaded) {
          <p class="converter__badge converter__badge--perf" role="status">
            Multi-thread FFmpeg · faster encoding
          </p>
        }
        @if (ffmpegService.isWebCodecsSupported) {
          <p class="converter__badge" role="status">
            WebCodecs · hardware acceleration available
          </p>
        }
      </div>

      <app-upload
        [compact]="queueService.hasItems()"
        [disabled]="queueService.isProcessing()"
        (filesSelected)="onFilesSelected($event)"
      />

      @if (validationError()) {
        <div class="converter__error" role="alert">
          {{ validationError() }}
        </div>
      }

      @if (queueService.hasItems()) {
        <div class="converter__panel">
          <div class="converter__queue-header">
            <span class="converter__queue-title">
              {{ queueService.queueItems().length }} arquivo(s)
            </span>
            @if (queueService.queueItems().length > 4) {
              <span class="converter__queue-hint">Role a lista para ver todos</span>
            }
          </div>

          <div class="converter__queue-scroll">
            <app-conversion-queue
              [items]="queueService.queueItems()"
              (removeItem)="onRemoveItem($event)"
            />
          </div>

          <div class="converter__controls">
            <app-format-selector
              [disabled]="queueService.isProcessing()"
              [(selectedFormat)]="selectedOutputFormat"
            />

            <div class="converter__summary">
              @if (queueService.queuedCount() > 0) {
                <span>{{ queueService.queuedCount() }} na fila</span>
              }
              @if (queueService.completedCount() > 0) {
                <span>{{ queueService.completedCount() }} concluído(s)</span>
              }
              @if (queueService.downloadedCount() > 0) {
                <span>{{ queueService.downloadedCount() }} baixado(s)</span>
              }
              <span>Máx. {{ maxFileSize | fileSize }} por arquivo</span>
            </div>

            <div class="converter__actions">
              <button
                type="button"
                class="converter__btn converter__btn--primary"
                [disabled]="!canStartConversion()"
                (click)="onStartConversion()"
              >
                @if (queueService.isProcessing()) {
                  Converting…
                } @else if (queueService.queuedCount() > 0) {
                  Convert {{ queueService.queuedCount() }} file(s) to {{ selectedOutputFormat() | uppercase }}
                } @else {
                  Convert to {{ selectedOutputFormat() | uppercase }}
                }
              </button>

              @if (queueService.canDownloadAll()) {
                <button
                  type="button"
                  class="converter__btn converter__btn--secondary"
                  [disabled]="queueService.isDownloadingAllZip()"
                  (click)="onDownloadAll()"
                >
                  @if (queueService.isDownloadingAllZip()) {
                    {{ queueService.downloadAllStatusText() ?? 'Salvando…' }}
                  } @else if (queueService.supportsFolderSave) {
                    Salvar todos em pasta ({{ queueService.completedCount() }})
                  } @else {
                    Baixar todos em ZIP ({{ queueService.completedCount() }})
                  }
                </button>
                @if (queueService.supportsFolderSave) {
                  <p class="converter__zip-hint" role="note">
                    Escolha uma pasta no computador — ideal para muitos vídeos grandes.
                  </p>
                } @else if (queueService.completedCount() > ZIP_BATCH_SIZE) {
                  <p class="converter__zip-hint" role="note">
                    Serão gerados vários ZIPs com até {{ ZIP_BATCH_SIZE }} vídeos cada.
                  </p>
                }
              }

              @if (queueService.completedCount() > 0 && !queueService.isProcessing()) {
                <button
                  type="button"
                  class="converter__btn converter__btn--secondary"
                  (click)="onClearCompleted()"
                >
                  Clear completed
                </button>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .converter {
      width: 100%;
    }

    .converter__header {
      margin-bottom: 1.25rem;
      text-align: center;
    }

    .converter__title {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      color: var(--text, #0f172a);
    }

    .converter__description {
      margin: 0;
      color: var(--text-muted, #64748b);
    }

    .converter__badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .converter__privacy {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      margin: 0;
      padding: 0.375rem 0.875rem;
      background: var(--success-light, #ecfdf5);
      color: var(--success, #047857);
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .converter__privacy-icon {
      font-size: 0.75rem;
    }

    .converter__badge {
      margin: 0;
      padding: 0.375rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--primary, #6366f1);
      background: var(--primary-light, #eef2ff);
      border-radius: 999px;
    }

    .converter__badge--perf {
      color: #047857;
      background: var(--success-light, #ecfdf5);
    }

    .converter__error {
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      background: var(--error-light, #fef2f2);
      color: var(--error, #b91c1c);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .converter__panel {
      display: flex;
      flex-direction: column;
      margin-top: 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
      background: var(--surface-elevated, #fff);
    }

    .converter__queue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      background: var(--surface, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .converter__queue-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text, #0f172a);
    }

    .converter__queue-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }

    .converter__queue-scroll {
      max-height: min(36vh, 300px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0.5rem;
      scrollbar-gutter: stable;
    }

    .converter__queue-scroll::-webkit-scrollbar {
      width: 6px;
    }

    .converter__queue-scroll::-webkit-scrollbar-thumb {
      background: var(--border-color, #cbd5e1);
      border-radius: 999px;
    }

    .converter__controls {
      padding: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--surface-elevated, #fff);
      box-shadow: var(--panel-shadow, 0 -4px 16px rgb(15 23 42 / 5%));
    }

    .converter__summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      margin: 0.75rem 0 0;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }

    .converter__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.875rem;
    }

    .converter__zip-hint {
      flex: 1 1 100%;
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      line-height: 1.4;
    }

    .converter__btn--primary {
      flex: 1;
      min-width: min(100%, 14rem);
    }

    .converter__btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: opacity 0.2s, transform 0.1s;
    }

    .converter__btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .converter__btn--primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 2px 12px rgb(99 102 241 / 30%);
    }

    .converter__btn--primary:hover:not(:disabled) {
      box-shadow: 0 4px 16px rgb(99 102 241 / 40%);
      transform: translateY(-1px);
    }

    .converter__btn--secondary {
      background: var(--surface, #f1f5f9);
      color: var(--text, #0f172a);
      border: 1px solid var(--border-color, #cbd5e1);
    }

    .converter__btn--secondary:hover {
      background: var(--border-color, #e2e8f0);
    }
  `,
})
export class ConverterComponent implements OnInit {
  readonly showHeader = input(true);
  readonly heading = input('Video Converter');
  readonly description = input<string | undefined>(undefined);
  readonly defaultOutputFormat = input<OutputFormat>('mp4');
  readonly defaultInputFormat = input<string | undefined>(undefined);

  readonly ffmpegService = inject(FfmpegService);
  readonly queueService = inject(ConversionQueueService);

  readonly maxFileSize = MAX_FILE_SIZE_BYTES;
  readonly ZIP_BATCH_SIZE = ZIP_BATCH_SIZE;
  readonly selectedOutputFormat = model<OutputFormat>('mp4');
  readonly validationError = model<string | null>(null);

  ngOnInit(): void {
    this.selectedOutputFormat.set(this.defaultOutputFormat());
  }

  onFilesSelected(files: File[]): void {
    this.validationError.set(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation) {
        errors.push(validation);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      this.validationError.set(errors.slice(0, 3).join(' '));
    }

    if (validFiles.length > 0) {
      this.queueService.addFiles(validFiles, this.selectedOutputFormat());
    }
  }

  onRemoveItem(id: string): void {
    this.queueService.removeItem(id);
  }

  onClearCompleted(): void {
    this.queueService.clearCompleted();
  }

  async onDownloadAll(): Promise<void> {
    try {
      await this.queueService.downloadAllCompleted();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Falha ao salvar os vídeos';
      this.validationError.set(message);
    }
  }

  canStartConversion(): boolean {
    return this.queueService.queuedCount() > 0 && !this.queueService.isProcessing();
  }

  async onStartConversion(): Promise<void> {
    this.validationError.set(null);
    await this.queueService.processQueue(this.selectedOutputFormat());
  }

  private validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds ${this.formatBytes(MAX_FILE_SIZE_BYTES)}.`;
    }

    const ext = getFileExtension(file.name);
    if (!this.isValidInputFormat(ext)) {
      return `"${file.name}" has unsupported format .${ext}.`;
    }

    if (this.defaultInputFormat() && ext !== this.defaultInputFormat()) {
      return `"${file.name}" is not .${this.defaultInputFormat()?.toUpperCase()}.`;
    }

    return null;
  }

  private isValidInputFormat(ext: string): boolean {
    return (SUPPORTED_INPUT_EXTENSIONS as readonly string[]).includes(ext);
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
