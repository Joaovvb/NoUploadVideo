import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  template: `
    <section class="cta-banner" aria-labelledby="cta-banner-title">
      <div class="cta-banner__inner">
        <div class="cta-banner__content">
          <h2 id="cta-banner-title" class="cta-banner__title">{{ title() }}</h2>
          <p class="cta-banner__text">{{ description() }}</p>
        </div>
        <button type="button" class="cta-banner__btn" (click)="ctaClick.emit()">
          {{ buttonLabel() }}
        </button>
      </div>
    </section>
  `,
  styleUrl: './cta-banner.component.scss',
})
export class CtaBannerComponent {
  readonly title = input('Ready to convert your video?');
  readonly description = input(
    'Drop your file, pick a format, and download — all without uploading to any server.',
  );
  readonly buttonLabel = input('Convert Now — It\'s Free');

  readonly ctaClick = output<void>();
}
