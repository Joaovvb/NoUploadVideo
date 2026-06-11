import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'video-converter',
    pathMatch: 'full',
  },
  {
    path: 'video-converter',
    loadComponent: () =>
      import('./features/pages/video-converter/video-converter.page').then(
        (m) => m.VideoConverterPage,
      ),
    title: 'Free Online Video Converter — NoUploadVideo',
  },
  {
    path: 'avi-to-mp4',
    loadComponent: () =>
      import('./features/pages/avi-to-mp4/avi-to-mp4.page').then((m) => m.AviToMp4Page),
    title: 'AVI to MP4 Converter — NoUploadVideo',
  },
  {
    path: 'mkv-to-mp4',
    loadComponent: () =>
      import('./features/pages/mkv-to-mp4/mkv-to-mp4.page').then((m) => m.MkvToMp4Page),
    title: 'MKV to MP4 Converter — NoUploadVideo',
  },
  {
    path: 'mov-to-mp4',
    loadComponent: () =>
      import('./features/pages/mov-to-mp4/mov-to-mp4.page').then((m) => m.MovToMp4Page),
    title: 'MOV to MP4 Converter — NoUploadVideo',
  },
  {
    path: '**',
    redirectTo: 'video-converter',
  },
];
