import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ZIP_BATCH_SIZE } from '../constants/download.constants';
import { OutputFormat } from '../models/conversion-format.model';
import { ConversionQueueItem } from '../models/conversion-queue-item.model';
import { getQueueItemDownloadName } from '../utils/download-filename.util';
import { FfmpegService, getFileExtension } from './ffmpeg.service';

@Injectable({ providedIn: 'root' })
export class ConversionQueueService {
  private readonly ffmpegService = inject(FfmpegService);

  private readonly items = signal<ConversionQueueItem[]>([]);
  private isRunning = false;
  private progressSubscription: Subscription | null = null;
  private activeItemId: string | null = null;

  private readonly isDownloadingAll = signal(false);
  private readonly downloadAllStatus = signal<string | null>(null);

  readonly queueItems = this.items.asReadonly();
  readonly isDownloadingAllZip = this.isDownloadingAll.asReadonly();
  readonly downloadAllStatusText = this.downloadAllStatus.asReadonly();

  readonly supportsFolderSave =
    typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  readonly hasItems = computed(() => this.items().length > 0);

  readonly isProcessing = computed(() =>
    this.items().some((item) => item.status === 'processing'),
  );

  readonly queuedCount = computed(() =>
    this.items().filter((item) => item.status === 'queued').length,
  );

  readonly completedCount = computed(() =>
    this.items().filter((item) => item.status === 'completed').length,
  );

  readonly downloadedCount = computed(() =>
    this.items().filter((item) => item.status === 'completed' && item.downloaded).length,
  );

  /** Batch finished with 2+ files ready to download */
  readonly canDownloadAll = computed(() => {
    const completed = this.items().filter(
      (item) => item.status === 'completed' && this.hasOutput(item),
    );
    return (
      !this.isProcessing() &&
      this.queuedCount() === 0 &&
      completed.length >= 2
    );
  });

  addFiles(files: File[], outputFormat: OutputFormat): void {
    const newItems: ConversionQueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      inputFormat: getFileExtension(file.name),
      outputFormat,
      status: 'queued',
      progress: 0,
      statusText: null,
      outputUrl: null,
      outputData: null,
      errorMessage: null,
      downloaded: false,
    }));

    this.items.update((current) => [...current, ...newItems]);
  }

  removeItem(id: string): void {
    const item = this.items().find((entry) => entry.id === id);
    if (!item || item.status === 'processing') {
      return;
    }

    this.releaseOutput(item);
    this.items.update((current) => current.filter((entry) => entry.id !== id));
  }

  markItemDownloaded(id: string): void {
    const item = this.items().find((entry) => entry.id === id);
    if (!item || item.status !== 'completed') {
      return;
    }
    this.patchItem(id, { downloaded: true });
  }

  downloadItem(item: ConversionQueueItem): void {
    if (item.status !== 'completed') {
      return;
    }

    const url = item.outputUrl ?? this.createObjectUrl(item);
    if (!url) {
      return;
    }

    this.triggerDownload(url, getQueueItemDownloadName(item));

    if (!item.outputUrl) {
      URL.revokeObjectURL(url);
    }

    this.markItemDownloaded(item.id);
  }

  async downloadAllCompleted(): Promise<void> {
    if (this.isDownloadingAll() || !this.canDownloadAll()) {
      return;
    }

    const completed = this.items().filter(
      (item) => item.status === 'completed' && this.hasOutput(item),
    );

    if (completed.length === 0) {
      return;
    }

    this.isDownloadingAll.set(true);
    this.downloadAllStatus.set(null);

    try {
      if (this.supportsFolderSave) {
        await this.saveAllToDirectory(completed);
      } else {
        await this.downloadAllAsZips(completed);
      }

      completed.forEach((item) => this.markItemDownloaded(item.id));
    } finally {
      this.isDownloadingAll.set(false);
      this.downloadAllStatus.set(null);
    }
  }

  clearCompleted(): void {
    this.items.update((current) => {
      current
        .filter((item) => item.status === 'completed')
        .forEach((item) => this.releaseOutput(item));
      return current.filter((item) => item.status !== 'completed');
    });
  }

  async processQueue(outputFormat: OutputFormat): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.items.update((current) =>
      current.map((item) =>
        item.status === 'queued' ? { ...item, outputFormat } : item,
      ),
    );

    try {
      while (true) {
        const next = this.items().find((item) => item.status === 'queued');
        if (!next) {
          break;
        }
        await this.processItem(next);
      }
    } finally {
      this.isRunning = false;
      this.detachProgress();
    }
  }

  private async processItem(item: ConversionQueueItem): Promise<void> {
    this.activeItemId = item.id;
    this.patchItem(item.id, {
      status: 'processing',
      progress: 0,
      statusText: null,
      errorMessage: null,
      outputUrl: null,
      outputData: null,
      downloaded: false,
    });
    this.attachProgress(item.id);

    try {
      const result = await this.ffmpegService.convert(item.file, item.outputFormat);
      this.patchItem(item.id, {
        status: 'completed',
        progress: 100,
        outputUrl: result.url,
        outputData: result.data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed';
      this.patchItem(item.id, {
        status: 'error',
        errorMessage: message,
      });
    } finally {
      this.detachProgress();
      this.activeItemId = null;
    }
  }

  private hasOutput(item: ConversionQueueItem): boolean {
    return !!item.outputData || !!item.outputUrl;
  }

  private resolveOutputData(item: ConversionQueueItem): Uint8Array {
    if (item.outputData) {
      return item.outputData;
    }

    throw new Error(
      `Não foi possível ler "${item.file.name}". Limpe os concluídos, converta novamente e tente de novo.`,
    );
  }

  private createObjectUrl(item: ConversionQueueItem): string | null {
    if (!item.outputData) {
      return null;
    }

    return URL.createObjectURL(new Blob([item.outputData], { type: this.guessMimeType(item) }));
  }

  private guessMimeType(item: ConversionQueueItem): string {
    const map: Record<string, string> = {
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
    };
    return map[item.outputFormat] ?? 'application/octet-stream';
  }

  private async saveAllToDirectory(items: ConversionQueueItem[]): Promise<void> {
    const directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const usedNames = new Set<string>();

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      this.downloadAllStatus.set(`Salvando ${index + 1}/${items.length}…`);

      const data = this.resolveOutputData(item);
      const fileName = this.uniqueName(getQueueItemDownloadName(item), usedNames);
      usedNames.add(fileName);

      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
    }
  }

  private async downloadAllAsZips(items: ConversionQueueItem[]): Promise<void> {
    const { default: JSZip } = await import('jszip');
    const totalBatches = Math.ceil(items.length / ZIP_BATCH_SIZE);
    const timestamp = new Date().toISOString().slice(0, 10);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * ZIP_BATCH_SIZE;
      const batch = items.slice(batchStart, batchStart + ZIP_BATCH_SIZE);
      this.downloadAllStatus.set(
        totalBatches > 1
          ? `ZIP ${batchIndex + 1}/${totalBatches}…`
          : 'Preparando ZIP…',
      );

      const zip = new JSZip();
      const usedInZip = new Set<string>();

      for (const item of batch) {
        const data = this.resolveOutputData(item);
        const entryName = this.uniqueName(getQueueItemDownloadName(item), usedInZip);
        usedInZip.add(entryName);
        zip.file(entryName, data);
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
      });

      const suffix = totalBatches > 1 ? `-parte-${batchIndex + 1}-de-${totalBatches}` : '';
      const zipUrl = URL.createObjectURL(zipBlob);
      this.triggerDownload(zipUrl, `videos-convertidos-${timestamp}${suffix}.zip`);
      URL.revokeObjectURL(zipUrl);
    }
  }

  private uniqueName(baseName: string, usedNames: Set<string>): string {
    if (!usedNames.has(baseName)) {
      return baseName;
    }

    const dotIndex = baseName.lastIndexOf('.');
    const stem = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;
    const extension = dotIndex > 0 ? baseName.slice(dotIndex) : '';
    let index = 2;

    while (usedNames.has(`${stem} (${index})${extension}`)) {
      index += 1;
    }

    return `${stem} (${index})${extension}`;
  }

  private attachProgress(itemId: string): void {
    this.detachProgress();
    this.progressSubscription = this.ffmpegService.progress$.subscribe(({ progress, status }) => {
      if (this.activeItemId === itemId) {
        this.patchItem(itemId, { progress, statusText: status });
      }
    });
  }

  private detachProgress(): void {
    this.progressSubscription?.unsubscribe();
    this.progressSubscription = null;
  }

  private patchItem(id: string, patch: Partial<ConversionQueueItem>): void {
    this.items.update((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  private releaseOutput(item: ConversionQueueItem): void {
    if (item.outputUrl) {
      URL.revokeObjectURL(item.outputUrl);
    }
  }

  private triggerDownload(url: string, filename: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.click();
  }
}
