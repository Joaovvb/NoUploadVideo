import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <div class="app">
      <header class="app__header">
        <div class="app__header-inner">
          <a routerLink="/video-converter" class="app__brand" aria-label="NoUploadVideo home">
            <span class="app__logo" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="28" rx="8" fill="url(#logo-gradient)"/>
                <path d="M8 9v10l10-5L8 9z" fill="white"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
                    <stop stop-color="#6366f1"/>
                    <stop offset="1" stop-color="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span class="app__name">NoUploadVideo</span>
          </a>

          <nav class="app__nav" aria-label="Converter pages">
            <a
              routerLink="/video-converter"
              routerLinkActive="app__nav-link--active"
              class="app__nav-link"
            >
              Converter
            </a>
            <a
              routerLink="/avi-to-mp4"
              routerLinkActive="app__nav-link--active"
              class="app__nav-link"
            >
              AVI → MP4
            </a>
            <a
              routerLink="/mkv-to-mp4"
              routerLinkActive="app__nav-link--active"
              class="app__nav-link"
            >
              MKV → MP4
            </a>
            <a
              routerLink="/mov-to-mp4"
              routerLinkActive="app__nav-link--active"
              class="app__nav-link"
            >
              MOV → MP4
            </a>
          </nav>

          <div class="app__header-actions">
            <app-theme-toggle />
            <a routerLink="/video-converter" class="app__cta" (click)="scrollToConverter($event)">
              Start Free
            </a>
          </div>
        </div>
      </header>

      <main class="app__main">
        <router-outlet />
      </main>

      <footer class="app__footer">
        <div class="app__footer-inner">
          <div class="app__footer-brand">
            <span class="app__footer-name">NoUploadVideo</span>
            <p class="app__footer-tagline">100% client-side video conversion powered by FFmpeg WebAssembly.</p>
          </div>
          <nav class="app__footer-nav" aria-label="Footer navigation">
            <a routerLink="/video-converter">Video Converter</a>
            <a routerLink="/avi-to-mp4">AVI to MP4</a>
            <a routerLink="/mkv-to-mp4">MKV to MP4</a>
            <a routerLink="/mov-to-mp4">MOV to MP4</a>
          </nav>
        </div>
        <p class="app__footer-copy">&copy; {{ currentYear }} NoUploadVideo. Your files never leave your browser.</p>
      </footer>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();

  scrollToConverter(event: Event): void {
    const target = event.currentTarget as HTMLAnchorElement;
    if (!target.pathname || window.location.pathname === target.pathname) {
      event.preventDefault();
      document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
