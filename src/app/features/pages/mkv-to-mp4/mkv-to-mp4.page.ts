import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingLayoutComponent } from '../../../shared/layouts/landing-layout/landing-layout.component';
import { ConverterComponent } from '../../converter/converter.component';

@Component({
  selector: 'app-mkv-to-mp4-page',
  standalone: true,
  imports: [LandingLayoutComponent, ConverterComponent],
  template: `
    <app-landing-layout
      heroTitle="MKV to MP4 Converter"
      heroSubtitle="Turn Matroska MKV files into MP4 videos that play everywhere — phones, browsers, and social media."
      heroBadge="MKV → MP4 · No Upload"
      converterCardTitle="Convert MKV to MP4"
      converterCardSubtitle="Upload your .mkv file and download a compatible MP4."
      ctaTitle="Convert your MKV file now"
      ctaButtonLabel="Upload MKV File"
    >
      <app-converter
        [showHeader]="false"
        defaultOutputFormat="mp4"
        defaultInputFormat="mkv"
      />
    </app-landing-layout>
  `,
})
export class MkvToMp4Page implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('MKV to MP4 Converter — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Free online MKV to MP4 converter. 100% client-side processing — your videos never leave your browser.',
    });
  }
}
