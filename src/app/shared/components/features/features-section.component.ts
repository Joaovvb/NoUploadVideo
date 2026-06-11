import { Component, input } from '@angular/core';

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features-section',
  standalone: true,
  template: `
    <section class="features" aria-labelledby="features-title">
      <header class="features__header">
        <h2 id="features-title" class="features__title">{{ sectionTitle() }}</h2>
        <p class="features__subtitle">{{ sectionSubtitle() }}</p>
      </header>

      <div class="features__grid">
        @for (feature of features(); track feature.title) {
          <article class="features__card">
            <span class="features__icon" aria-hidden="true">{{ feature.icon }}</span>
            <h3 class="features__card-title">{{ feature.title }}</h3>
            <p class="features__card-text">{{ feature.description }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './features-section.component.scss',
})
export class FeaturesSectionComponent {
  readonly sectionTitle = input('Why choose NoUploadVideo?');
  readonly sectionSubtitle = input('Professional-grade conversion without compromising your privacy.');

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
}
