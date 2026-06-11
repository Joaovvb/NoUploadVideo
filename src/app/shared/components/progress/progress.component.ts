import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress" role="status" [attr.aria-busy]="isActive()" aria-live="polite">
      @if (isActive()) {
        <div class="progress__header">
          <span class="progress__status">{{ statusLabel() || 'Processing locally…' }}</span>
          <span class="progress__percent" aria-hidden="true">{{ displayProgress() }}%</span>
        </div>

        <div
          class="progress__bar"
          role="progressbar"
          [attr.aria-valuenow]="displayProgress()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="statusLabel() || 'Conversion progress'"
        >
          <div
            class="progress__fill"
            [class.progress__fill--active]="isConverting()"
            [style.width.%]="displayProgress()"
          ></div>
        </div>
      }
    </div>
  `,
  styles: `
    .progress {
      margin: 1.25rem 0;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: var(--surface, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .progress__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .progress__status {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
    }

    .progress__percent {
      font-size: 1.125rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--primary, #6366f1);
      min-width: 3rem;
      text-align: right;
    }

    .progress__bar {
      height: 10px;
      background: var(--border-color, #e2e8f0);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary, #6366f1), var(--accent, #8b5cf6));
      border-radius: 999px;
      transition: width 0.2s linear;
      will-change: width;
    }

    .progress__fill--active {
      background: linear-gradient(
        90deg,
        var(--primary, #6366f1) 0%,
        var(--accent, #8b5cf6) 50%,
        var(--primary, #6366f1) 100%
      );
      background-size: 200% 100%;
      animation: progress-shimmer 1.5s linear infinite;
    }

    @keyframes progress-shimmer {
      0% {
        background-position: 100% 0;
      }
      100% {
        background-position: -100% 0;
      }
    }
  `,
})
export class ProgressComponent {
  readonly progress = input(0);
  readonly isActive = input(false);
  readonly statusLabel = input('');

  readonly displayProgress = computed(() => {
    const value = this.progress();
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(value)));
  });

  readonly isConverting = computed(
    () => this.isActive() && this.displayProgress() >= 10 && this.displayProgress() < 100,
  );
}
