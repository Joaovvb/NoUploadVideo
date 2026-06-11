import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="hero__container">
        @if (badge()) {
          <span class="hero__badge">{{ badge() }}</span>
        }

        <h1 id="hero-title" class="hero__title">{{ title() }}</h1>

        @if (subtitle()) {
          <p class="hero__subtitle">{{ subtitle() }}</p>
        }

        <div class="hero__actions">
          <button type="button" class="hero__cta hero__cta--primary" (click)="primaryCtaClick.emit()">
            {{ primaryCtaLabel() }}
          </button>
          @if (secondaryCtaLabel()) {
            <button type="button" class="hero__cta hero__cta--secondary" (click)="secondaryCtaClick.emit()">
              {{ secondaryCtaLabel() }}
            </button>
          }
        </div>

        <ul class="hero__trust" aria-label="Key benefits">
          @for (item of trustItems(); track item) {
            <li class="hero__trust-item">
              <span class="hero__trust-icon" aria-hidden="true">✓</span>
              {{ item }}
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly badge = input('100% Private · No Upload');
  readonly primaryCtaLabel = input('Start Converting Free');
  readonly secondaryCtaLabel = input('See how it works');

  readonly trustItems = input<string[]>([
    'Runs in your browser',
    'Up to 200 MB files',
    'FFmpeg WebAssembly',
  ]);

  readonly primaryCtaClick = output<void>();
  readonly secondaryCtaClick = output<void>();
}
