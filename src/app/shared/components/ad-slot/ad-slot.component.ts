import { Component, input } from '@angular/core';
import { ADS_ENABLED } from '../../../core/constants/ads.constants';

export type AdSlotPosition =
  | 'leaderboard'
  | 'sidebar-left'
  | 'sidebar-right'
  | 'in-content'
  | 'footer-banner';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (adsEnabled) {
      <aside
        class="ad-slot"
        [class]="'ad-slot--' + position()"
        [attr.aria-label]="ariaLabel()"
        role="complementary"
      >
        <div class="ad-slot__frame">
          <span class="ad-slot__label">Advertisement</span>
          <div class="ad-slot__placeholder">
            <span class="ad-slot__size">{{ sizeLabel() }}</span>
            <span class="ad-slot__hint">Ad placement — insert your ad code here</span>
          </div>
        </div>
      </aside>
    }
  `,
  styleUrl: './ad-slot.component.scss',
})
export class AdSlotComponent {
  readonly adsEnabled = ADS_ENABLED;
  readonly position = input<AdSlotPosition>('in-content');
  readonly ariaLabel = input('Advertisement placement area');

  /** Human-readable slot dimensions for publishers */
  sizeLabel(): string {
    const sizes: Record<AdSlotPosition, string> = {
      leaderboard: '728 × 90',
      'sidebar-left': '160 × 600',
      'sidebar-right': '300 × 250',
      'in-content': '336 × 280',
      'footer-banner': '970 × 90',
    };
    return sizes[this.position()];
  }
}
