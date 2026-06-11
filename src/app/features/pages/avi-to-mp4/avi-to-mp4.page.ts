import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingLayoutComponent } from '../../../shared/layouts/landing-layout/landing-layout.component';
import { ConverterComponent } from '../../converter/converter.component';

@Component({
  selector: 'app-avi-to-mp4-page',
  standalone: true,
  imports: [LandingLayoutComponent, ConverterComponent],
  template: `
    <app-landing-layout
      heroTitle="AVI to MP4 Converter"
      heroSubtitle="Convert legacy AVI videos to universally compatible MP4 format — fast, free, and completely private."
      heroBadge="AVI → MP4 · No Upload"
      converterCardTitle="Convert AVI to MP4"
      converterCardSubtitle="Upload your .avi file and download a ready-to-share MP4."
      ctaTitle="Convert your AVI file now"
      ctaButtonLabel="Upload AVI File"
    >
      <app-converter
        [showHeader]="false"
        defaultOutputFormat="mp4"
        defaultInputFormat="avi"
      />
    </app-landing-layout>
  `,
})
export class AviToMp4Page implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('AVI to MP4 Converter — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Free online AVI to MP4 converter. 100% client-side processing — your videos never leave your browser.',
    });
  }
}
