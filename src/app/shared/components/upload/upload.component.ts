import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="upload-zone"
      [class.upload-zone--compact]="compact()"
      [class.upload-zone--active]="isDragOver()"
      [class.upload-zone--disabled]="disabled()"
      role="button"
      tabindex="0"
      [attr.aria-label]="multiple() ? 'Upload video files by drag and drop or click to browse' : 'Upload video file by drag and drop or click to browse'"
      (click)="onZoneClick()"
      (keydown.enter)="onZoneClick()"
      (keydown.space)="onZoneClick(); $event.preventDefault()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <input
        #fileInput
        type="file"
        class="upload-zone__input"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="disabled()"
        aria-hidden="true"
        tabindex="-1"
        (change)="onFileSelected($event)"
      />

      <div class="upload-zone__placeholder">
        <span class="upload-zone__icon" aria-hidden="true">{{ compact() ? '➕' : '⬆️' }}</span>
        <p class="upload-zone__title">
          @if (compact()) {
            Add more videos
          } @else if (multiple()) {
            Drag & drop your videos here
          } @else {
            Drag & drop your video here
          }
        </p>
        @if (!compact()) {
          <p class="upload-zone__subtitle">
            @if (multiple()) {
              or click to browse — select multiple files
            } @else {
              or click to browse
            }
          </p>
        }
      </div>
    </div>
  `,
  styles: `
    .upload-zone {
      border: 2px dashed var(--border-color, #cbd5e1);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      background: linear-gradient(180deg, var(--upload-bg-start, #fafbff) 0%, var(--upload-bg-end, #f8fafc) 100%);
    }

    .upload-zone:hover:not(.upload-zone--disabled),
    .upload-zone--active {
      border-color: var(--primary, #6366f1);
      background: var(--primary-light, #eef2ff);
      box-shadow: 0 0 0 4px rgb(99 102 241 / 8%);
    }

    .upload-zone--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .upload-zone__input {
      display: none;
    }

    .upload-zone__icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .upload-zone__title {
      font-weight: 600;
      margin: 0 0 0.25rem;
      color: var(--text, #0f172a);
    }

    .upload-zone__subtitle {
      margin: 0;
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
    }

    .upload-zone--compact {
      padding: 0.75rem 1rem;
    }

    .upload-zone--compact .upload-zone__placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .upload-zone--compact .upload-zone__icon {
      font-size: 1rem;
      margin-bottom: 0;
    }

    .upload-zone--compact .upload-zone__title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `,
})
export class UploadComponent {
  readonly accept = input('video/*,.avi,.mp4,.mkv,.mov,.webm,audio/mpeg,.mp3');
  readonly disabled = input(false);
  readonly multiple = input(true);
  readonly compact = input(false);

  readonly filesSelected = output<File[]>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly isDragOver = signal(false);

  onZoneClick(): void {
    if (this.disabled()) {
      return;
    }
    this.fileInput()?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.disabled()) {
      return;
    }

    const files = this.collectFiles(event.dataTransfer?.files);
    if (files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = this.collectFiles(input.files);
    if (files.length > 0) {
      this.filesSelected.emit(files);
    }
    input.value = '';
  }

  private collectFiles(fileList: FileList | null | undefined): File[] {
    if (!fileList) {
      return [];
    }
    return Array.from(fileList);
  }
}
