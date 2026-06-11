export interface ConversionResult {
  blob: Blob;
  /** Cópia estável dos bytes (evita blob inválido após transfer do worker) */
  data: Uint8Array;
  url: string;
}
