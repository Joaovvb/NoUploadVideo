export type PlausibleEvent = 'pageview';

export interface PlausibleFn {
  (event: PlausibleEvent, options?: { props?: Record<string, string> }): void;
  q?: unknown[];
  init?: (options?: Record<string, unknown>) => void;
  o?: Record<string, unknown>;
}

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export {};
