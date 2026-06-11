import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { ConversionQueueItem } from '../../../core/models/conversion-queue-item.model';
import { ConversionQueueService } from '../../../core/services/conversion-queue.service';
import { getQueueItemDownloadName } from '../../../core/utils/download-filename.util';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-conversion-queue',
  standalone: true,
  imports: [CommonModule, FileSizePipe],
  template: `
    <ul class="queue" role="list" aria-label="Conversion queue">
      @for (item of items(); track item.id) {
        <li
          class="queue__item"
          [class.queue__item--active]="item.status === 'processing'"
          [class.queue__item--downloaded]="item.status === 'completed' && item.downloaded"
        >
          <span class="queue__icon" aria-hidden="true">
            @if (item.status === 'completed' && item.downloaded) {
              <span class="queue__icon-check">✓</span>
            } @else {
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor"/>
              </svg>
            }
          </span>

          <div class="queue__body">
            <p class="queue__name" [title]="item.file.name">{{ item.file.name }}</p>

            @switch (item.status) {
              @case ('processing') {
                <div
                  class="queue__bar"
                  role="progressbar"
                  [attr.aria-valuenow]="item.progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-label]="'Converting ' + item.file.name"
                >
                  <div class="queue__bar-fill" [style.width.%]="item.progress"></div>
                </div>
                <span class="queue__status queue__status--progress">
                  @if (item.statusText) {
                    {{ item.statusText }}
                  } @else {
                    {{ item.progress }}%
                  }
                </span>
              }
              @case ('queued') {
                <span class="queue__status">Na fila</span>
              }
              @case ('completed') {
                <div class="queue__completed-actions">
                  @if (item.downloaded) {
                    <span class="queue__status queue__status--downloaded">
                      Baixado
                    </span>
                    <button
                      type="button"
                      class="queue__download-again"
                      [attr.aria-label]="'Baixar novamente ' + item.file.name"
                      (click)="onDownload(item)"
                    >
                      Baixar novamente
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="queue__download"
                      [attr.aria-label]="'Download ' + downloadName(item)"
                      (click)="onDownload(item)"
                    >
                      Download {{ item.outputFormat | uppercase }}
                    </button>
                  }
                </div>
              }
              @case ('error') {
                <span class="queue__status queue__status--error">{{ item.errorMessage }}</span>
              }
              @case ('cancelled') {
                <span class="queue__status">Cancelado</span>
              }
            }
          </div>

          <span class="queue__size">{{ item.file.size | fileSize }}</span>

          <button
            type="button"
            class="queue__remove"
            [disabled]="item.status === 'processing'"
            [attr.aria-label]="'Remove ' + item.file.name"
            (click)="removeItem.emit(item.id)"
          >
            ×
          </button>
        </li>
      }
    </ul>
  `,
  styleUrl: './conversion-queue.component.scss',
})
export class ConversionQueueComponent {
  private readonly queueService = inject(ConversionQueueService);

  readonly items = input<ConversionQueueItem[]>([]);
  readonly removeItem = output<string>();

  downloadName(item: ConversionQueueItem): string {
    return getQueueItemDownloadName(item);
  }

  onDownload(item: ConversionQueueItem): void {
    this.queueService.downloadItem(item);
  }
}
