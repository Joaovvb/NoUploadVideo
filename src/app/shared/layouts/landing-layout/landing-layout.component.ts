import { Component, input } from '@angular/core';
import { AdSlotComponent } from '../../components/ad-slot/ad-slot.component';
import { CtaBannerComponent } from '../../components/cta-banner/cta-banner.component';
import { FeatureItem, FeaturesSectionComponent } from '../../components/features/features-section.component';
import { HeroSectionComponent } from '../../components/hero/hero-section.component';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
  imports: [
    HeroSectionComponent,
    AdSlotComponent,
    FeaturesSectionComponent,
    CtaBannerComponent,
  ],
  template: `
    <app-hero-section
      [title]="heroTitle()"
      [subtitle]="heroSubtitle()"
      [badge]="heroBadge()"
      [primaryCtaLabel]="primaryCtaLabel()"
      [secondaryCtaLabel]="secondaryCtaLabel()"
      [trustItems]="trustItems()"
      (primaryCtaClick)="scrollToConverter()"
      (secondaryCtaClick)="scrollToHowItWorks()"
    />

    <div class="landing">
      <aside class="landing__sidebar landing__sidebar--left" aria-label="Left sidebar advertisements">
        <app-ad-slot position="sidebar-left" />
      </aside>

      <div class="landing__main">
        <div class="landing__leaderboard">
          <app-ad-slot position="leaderboard" />
        </div>

        <div id="converter" class="landing__converter-card">
          <div class="landing__converter-header">
            <h2 class="landing__converter-title">{{ converterCardTitle() }}</h2>
            <p class="landing__converter-subtitle">{{ converterCardSubtitle() }}</p>
          </div>
          <ng-content />
        </div>

        <div class="landing__in-content-ad">
          <app-ad-slot position="in-content" />
        </div>

        <div id="how-it-works">
          <app-features-section
            [sectionTitle]="featuresTitle()"
            [sectionSubtitle]="featuresSubtitle()"
            [features]="features()"
          />
        </div>

        <app-cta-banner
          [title]="ctaTitle()"
          [description]="ctaDescription()"
          [buttonLabel]="ctaButtonLabel()"
          (ctaClick)="scrollToConverter()"
        />
      </div>

      <aside class="landing__sidebar landing__sidebar--right" aria-label="Right sidebar advertisements">
        <app-ad-slot position="sidebar-right" />
      </aside>
    </div>

    <div class="landing__footer-ad">
      <app-ad-slot position="footer-banner" />
    </div>
  `,
  styleUrl: './landing-layout.component.scss',
})
export class LandingLayoutComponent {
  readonly heroTitle = input.required<string>();
  readonly heroSubtitle = input<string>();
  readonly heroBadge = input('100% Private · No Upload');
  readonly primaryCtaLabel = input('Start Converting Free');
  readonly secondaryCtaLabel = input('See how it works');
  readonly trustItems = input<string[]>([
    'Runs in your browser',
    'Up to 200 MB files',
    'FFmpeg WebAssembly',
  ]);

  readonly converterCardTitle = input('Upload & Convert');
  readonly converterCardSubtitle = input('Drag your file below and choose an output format.');

  readonly featuresTitle = input('Why choose NoUploadVideo?');
  readonly featuresSubtitle = input('Professional-grade conversion without compromising your privacy.');
  readonly features = input<FeatureItem[]>([
    {
      icon: '🔒',
      title: 'Zero uploads',
      description: 'Your files never leave your device. All processing happens locally in your browser.',
    },
    {
      icon: '⚡',
      title: 'Fast conversion',
      description: 'Powered by FFmpeg WebAssembly with optional WebCodecs hardware acceleration.',
    },
    {
      icon: '🎬',
      title: 'Multiple formats',
      description: 'Convert between MP4, AVI, MKV, MOV and extract MP3 audio in one click.',
    },
  ]);

  readonly ctaTitle = input('Ready to convert your video?');
  readonly ctaDescription = input(
    'Drop your file, pick a format, and download — all without uploading to any server.',
  );
  readonly ctaButtonLabel = input('Convert Now — It\'s Free');

  scrollToConverter(): void {
    document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToHowItWorks(): void {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
