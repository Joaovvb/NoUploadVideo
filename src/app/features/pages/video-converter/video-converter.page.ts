import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingLayoutComponent } from '../../../shared/layouts/landing-layout/landing-layout.component';
import { ConverterComponent } from '../../converter/converter.component';

@Component({
  selector: 'app-video-converter-page',
  standalone: true,
  imports: [LandingLayoutComponent, ConverterComponent],
  template: `
    <app-landing-layout
      heroTitle="Convert videos in your browser — no upload required"
      heroSubtitle="Transform AVI, MP4, MKV, MOV and extract MP3 audio instantly. 100% private, powered by FFmpeg WebAssembly."
      converterCardTitle="Upload & Convert"
      converterCardSubtitle="Drag your file below and choose an output format."
      ctaTitle="Start converting for free"
      ctaDescription="No sign-up, no upload, no waiting in a queue. Just drop your file and download."
    >
      <app-converter [showHeader]="false" defaultOutputFormat="mp4" />
    </app-landing-layout>
  `,
})
export class VideoConverterPage implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('Free Online Video Converter — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Convert videos between MP4, AVI, MKV, MOV and extract MP3. 100% private, client-side processing.',
    });
  }
}
