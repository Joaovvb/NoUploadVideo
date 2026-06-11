/// <reference lib="webworker" />

import { FFmpegCoreInstance } from '../models/ffmpeg-core.model';
import { ConvertPayload, WorkerInboundMessage, WorkerOutboundMessage } from '../models/worker-message.model';
import { ConversionStrategy, buildConversionStrategies } from '../utils/ffmpeg-args';

let ffmpegCore: FFmpegCoreInstance | null = null;
let trackEncodeProgress = false;

const SETUP_PROGRESS_MAX = 14;
const ENCODE_PROGRESS_START = 15;
const ENCODE_PROGRESS_END = 97;

function post(message: WorkerOutboundMessage, transfer?: Transferable[]): void {
  self.postMessage(message, transfer ?? []);
}

function postProgress(progress: number, status: string): void {
  const safeProgress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, Math.round(progress)))
    : 0;
  post({ type: 'progress', progress: safeProgress, status });
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
}

function bindProgressHandler(): void {
  if (!ffmpegCore) {
    return;
  }

  ffmpegCore.setProgress(({ progress, time }) => {
    if (!trackEncodeProgress) {
      return;
    }

    const encodePercent = Math.round(ENCODE_PROGRESS_START + progress * (ENCODE_PROGRESS_END - ENCODE_PROGRESS_START));
    const timeLabel = formatSeconds(time);
    const status = timeLabel
      ? `Transcoding… ${Math.round(progress * 100)}% (${timeLabel})`
      : `Transcoding… ${Math.round(progress * 100)}%`;

    postProgress(encodePercent, status);
  });
}

async function loadEngine(coreURL: string, wasmURL: string, workerURL?: string): Promise<void> {
  postProgress(2, 'Loading FFmpeg engine…');

  const module = await import(/* @vite-ignore */ coreURL);
  const createFFmpegCore = module.default as (config: {
    mainScriptUrlOrBlob: string;
  }) => Promise<FFmpegCoreInstance>;

  const loadConfig: { wasmURL: string; workerURL?: string } = { wasmURL };
  if (workerURL) {
    loadConfig.workerURL = workerURL;
  }

  ffmpegCore = await createFFmpegCore({
    mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify(loadConfig))}`,
  });

  bindProgressHandler();
  postProgress(8, 'Engine ready');
}

function safeUnlink(path: string): void {
  if (!ffmpegCore) {
    return;
  }
  try {
    ffmpegCore.FS.unlink(path);
  } catch {
    // Output may not exist between retry attempts
  }
}

function execStrategy(args: string[]): number {
  if (!ffmpegCore) {
    throw new Error('FFmpeg is not loaded');
  }

  ffmpegCore.setTimeout(-1);
  ffmpegCore.exec(...args);
  const exitCode = ffmpegCore.ret;
  ffmpegCore.reset();
  return exitCode;
}

function runSingleStrategy(strategy: ConversionStrategy, index: number, total: number): void {
  trackEncodeProgress = strategy.tracksEncodeProgress;

  const setupProgress = Math.min(
    SETUP_PROGRESS_MAX,
    10 + Math.round((index / total) * 4),
  );

  postProgress(setupProgress, strategy.label);

  const exitCode = execStrategy(strategy.args);
  if (exitCode === 0) {
    return;
  }

  trackEncodeProgress = false;
  throw new StrategyFailedError();
}

class StrategyFailedError extends Error {
  constructor() {
    super('Strategy failed');
    this.name = 'StrategyFailedError';
  }
}

function runStrategies(
  inputName: string,
  outputName: string,
  outputFormat: string,
  trim?: ConvertPayload['trim'],
): void {
  const strategies = buildConversionStrategies(inputName, outputName, outputFormat, trim);

  for (let index = 0; index < strategies.length; index++) {
    safeUnlink(outputName);

    try {
      runSingleStrategy(strategies[index], index, strategies.length);
      return;
    } catch (error) {
      if (!(error instanceof StrategyFailedError)) {
        throw error;
      }
    }
  }

  throw new Error('FFmpeg conversion failed for all strategies');
}

async function runConvert(payload: ConvertPayload): Promise<ArrayBuffer> {
  if (!ffmpegCore) {
    throw new Error('FFmpeg is not loaded');
  }

  const inputName = `input.${payload.inputExt}`;
  const outputName = `output.${payload.outputFormat}`;

  postProgress(9, 'Writing input file…');
  ffmpegCore.FS.writeFile(inputName, new Uint8Array(payload.fileData));

  postProgress(10, 'Starting conversion…');
  runStrategies(inputName, outputName, payload.outputFormat, payload.trim);

  postProgress(98, 'Reading output file…');
  const outputData = ffmpegCore.FS.readFile(outputName);

  ffmpegCore.FS.unlink(inputName);
  ffmpegCore.FS.unlink(outputName);

  const buffer =
    outputData instanceof Uint8Array
      ? outputData.buffer.slice(outputData.byteOffset, outputData.byteOffset + outputData.byteLength)
      : new TextEncoder().encode(outputData as string).buffer;

  postProgress(100, 'Done');
  return buffer;
}

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const { type, payload, coreURL, wasmURL, workerURL } = event.data;

  try {
    if (type === 'init' && coreURL && wasmURL) {
      await loadEngine(coreURL, wasmURL, workerURL);
      post({ type: 'ready', multithreaded: !!workerURL });
      return;
    }

    if (type === 'convert' && payload) {
      const buffer = await runConvert(payload);
      post({ type: 'complete', data: buffer }, [buffer]);
      return;
    }

    post({ type: 'error', error: `Unknown worker message: ${type}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Conversion failed in worker';
    post({ type: 'error', error: message });
  }
};
