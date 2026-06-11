import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'nouploadvideo-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly themeMode = signal<ThemeMode>('light');
  readonly isDarkMode = computed(() => this.themeMode() === 'dark');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const initialTheme = this.resolveInitialTheme();
    this.themeMode.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  toggle(): void {
    this.setTheme(this.themeMode() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, mode);
      this.applyTheme(mode);
    }
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }
}
