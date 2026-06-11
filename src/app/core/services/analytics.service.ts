import { DestroyRef, inject, Injectable, isDevMode } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_SCRIPT_URL } from '../constants/analytics.constants';
import { PlausibleFn } from '../models/plausible.model';
import '../models/plausible.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private scriptLoaded = false;

  init(): void {
    if (!this.isEnabled()) {
      return;
    }

    this.loadScript();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.trackPageView());
  }

  isEnabled(): boolean {
    return !isDevMode() && PLAUSIBLE_SCRIPT_URL.length > 0;
  }

  private loadScript(): void {
    if (this.scriptLoaded || document.querySelector(`script[src="${PLAUSIBLE_SCRIPT_URL}"]`)) {
      this.scriptLoaded = true;
      return;
    }

    this.bootstrapPlausibleStub();

    const script = document.createElement('script');
    script.async = true;
    script.src = PLAUSIBLE_SCRIPT_URL;
    script.onload = () => window.plausible?.init?.();
    document.head.appendChild(script);
    this.scriptLoaded = true;
  }

  private bootstrapPlausibleStub(): void {
    if (window.plausible) {
      return;
    }

    const plausibleFn = ((...args: unknown[]) => {
      (plausibleFn.q = plausibleFn.q ?? []).push(args);
    }) as PlausibleFn;

    plausibleFn.init = (options) => {
      plausibleFn.o = options ?? {};
    };

    window.plausible = plausibleFn;
  }

  private trackPageView(): void {
    window.plausible?.('pageview');
  }
}
