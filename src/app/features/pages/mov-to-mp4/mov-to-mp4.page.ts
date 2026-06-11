import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingLayoutComponent } from '../../../shared/layouts/landing-layout/landing-layout.component';
import { ConverterComponent } from '../../converter/converter.component';

@Component({
  selector: 'app-mov-to-mp4-page',
  standalone: true,
  imports: [LandingLayoutComponent, ConverterComponent],
  template: `
    <app-landing-layout
      heroTitle="MOV to MP4 Converter"
      heroSubtitle="Convert Apple QuickTime MOV files to MP4 without uploading to any server. Perfect for sharing and editing."
      heroBadge="MOV → MP4 · No Upload"
      converterCardTitle="Convert MOV to MP4"
      converterCardSubtitle="Upload your .mov file and download a universal MP4."
      ctaTitle="Convert your MOV file now"
      ctaButtonLabel="Upload MOV File"
    >
      <app-converter
        [showHeader]="false"
        defaultOutputFormat="mp4"
        defaultInputFormat="mov"
      />
    </app-landing-layout>
  `,
})
export class MovToMp4Page implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('MOV to MP4 Converter — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Free online MOV to MP4 converter. 100% client-side processing — your videos never leave your browser.',
    });
  }
}
