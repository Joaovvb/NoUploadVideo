import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="isDarkMode()"
      (click)="onToggle()"
    >
      @if (isDarkMode()) {
        <svg
          class="theme-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      } @else {
        <svg
          class="theme-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      }
    </button>
  `,
  styles: `
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 10px;
      background: var(--surface-elevated, #fff);
      color: var(--text-muted, #64748b);
      cursor: pointer;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }

    .theme-toggle:hover {
      background: var(--surface, #f8fafc);
      color: var(--text, #0f172a);
      border-color: var(--primary, #6366f1);
    }

    .theme-toggle:focus-visible {
      outline: 2px solid var(--primary, #6366f1);
      outline-offset: 2px;
    }

    .theme-toggle__icon {
      display: block;
    }
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly isDarkMode = this.themeService.isDarkMode;

  onToggle(): void {
    this.themeService.toggle();
  }
}
