/** Messages exchanged between main thread and FFmpeg Web Worker */
export type WorkerMessageType =
  | 'init'
  | 'ready'
  | 'convert'
  | 'progress'
  | 'complete'
  | 'error';

export interface WorkerInboundMessage {
  type: WorkerMessageType;
  payload?: ConvertPayload;
  coreURL?: string;
  wasmURL?: string;
  workerURL?: string;
}

export interface ConvertPayload {
  fileData: ArrayBuffer;
  inputExt: string;
  outputFormat: string;
}

export interface WorkerOutboundMessage {
  type: WorkerMessageType;
  progress?: number;
  status?: string;
  data?: ArrayBuffer;
  error?: string;
  multithreaded?: boolean;
}
