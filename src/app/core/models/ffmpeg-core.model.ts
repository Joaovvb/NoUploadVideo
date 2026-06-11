/** Minimal typing for @ffmpeg/core low-level WASM instance */
export interface FFmpegCoreInstance {
  exec: (...args: string[]) => void;
  ret: number;
  reset: () => void;
  setTimeout: (timeout: number) => void;
  setProgress: (callback: (data: { progress: number; time: number }) => void) => void;
  setLogger: (callback: (data: { type: string; message: string }) => void) => void;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string, options?: { encoding?: string }) => Uint8Array;
    unlink: (path: string) => void;
  };
}

export type CreateFFmpegCore = (config: {
  mainScriptUrlOrBlob: string;
}) => Promise<FFmpegCoreInstance>;
