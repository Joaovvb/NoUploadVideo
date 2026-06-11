import { ConversionQueueItem } from '../models/conversion-queue-item.model';

export function getQueueItemDownloadName(item: ConversionQueueItem): string {
  const baseName = item.file.name.replace(/\.[^.]+$/, '');
  return `${baseName}.${item.outputFormat}`;
}
