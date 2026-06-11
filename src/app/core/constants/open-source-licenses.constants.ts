export interface OpenSourceDependency {
  name: string;
  version: string;
  license: string;
  url: string;
  role: string;
}

/** Runtime dependencies shipped to or used by the browser app */
export const OPEN_SOURCE_DEPENDENCIES: OpenSourceDependency[] = [
  {
    name: 'FFmpeg (via @ffmpeg/core & @ffmpeg/core-mt)',
    version: '0.12.6',
    license: 'LGPL-2.1+ / GPL-2+ (build-dependent)',
    url: 'https://ffmpeg.org',
    role: 'Video and audio conversion engine (WebAssembly)',
  },
  {
    name: 'Angular',
    version: '19.2.x',
    license: 'MIT',
    url: 'https://angular.dev',
    role: 'Application framework',
  },
  {
    name: '@ffmpeg/util',
    version: '0.12.2',
    license: 'MIT',
    url: 'https://www.npmjs.com/package/@ffmpeg/util',
    role: 'FFmpeg.wasm utilities',
  },
  {
    name: 'JSZip',
    version: '3.10.x',
    license: 'MIT or GPL-3.0',
    url: 'https://stuk.github.io/jszip/',
    role: 'Batch download as ZIP files',
  },
  {
    name: 'RxJS',
    version: '7.8.x',
    license: 'Apache-2.0',
    url: 'https://rxjs.dev',
    role: 'Async streams (conversion progress)',
  },
  {
    name: 'Zone.js',
    version: '0.15.x',
    license: 'MIT',
    url: 'https://github.com/angular/angular/tree/main/packages/zone.js',
    role: 'Angular change detection integration',
  },
  {
    name: 'tslib',
    version: '2.x',
    license: '0BSD',
    url: 'https://github.com/Microsoft/tslib',
    role: 'TypeScript helper runtime',
  },
];
