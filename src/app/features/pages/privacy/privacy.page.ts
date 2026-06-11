import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="privacy">
      <h1 class="privacy__title">Privacy Policy</h1>
      <p class="privacy__meta">Last updated: {{ lastUpdated }}</p>
      <p class="privacy__lead">
        NoUploadVideo (<a href="https://nouploadvideo.com">nouploadvideo.com</a>) is a free
        browser-based video converter. This policy explains what happens to your data when you use
        the site.
      </p>

      <section class="privacy__section" aria-labelledby="summary-heading">
        <h2 id="summary-heading" class="privacy__section-title">Summary</h2>
        <ul class="privacy__list">
          <li>Your video and audio files are processed <strong>only on your device</strong>.</li>
          <li>We do <strong>not</strong> upload your media to our servers for conversion.</li>
          <li>We do <strong>not</strong> require an account.</li>
          <li>We use <strong>privacy-friendly analytics</strong> (no advertising trackers).</li>
        </ul>
      </section>

      <section class="privacy__section" aria-labelledby="processing-heading">
        <h2 id="processing-heading" class="privacy__section-title">Video processing</h2>
        <p>
          When you select files, they stay in your browser memory. Conversion runs locally using
          FFmpeg WebAssembly in a Web Worker. Output files are offered for download from your
          browser — we never receive the content you convert.
        </p>
        <p>
          In production, FFmpeg WebAssembly binaries may be loaded from
          <a href="https://unpkg.com" target="_blank" rel="noopener noreferrer">unpkg.com</a>
          (same open-source version as documented on our
          <a routerLink="/licenses">Licenses</a> page). That request tells unpkg which public
          package files to deliver; it does <strong>not</strong> include your video files.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="collect-heading">
        <h2 id="collect-heading" class="privacy__section-title">Information we do not collect</h2>
        <p>
          We do not ask for your name, email address, or payment details. We do not operate a
          backend API that receives your uploads, conversion settings, or converted files.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="storage-heading">
        <h2 id="storage-heading" class="privacy__section-title">Local browser storage</h2>
        <p>
          The site may store your <strong>theme preference</strong> (light or dark mode) in
          <code>localStorage</code> under the key <code>nouploadvideo-theme</code>. This stays on
          your device and is not sent to us. You can clear it through your browser settings.
        </p>
        <p>
          Conversion queue state (files, progress, results) lives in memory while you use the page
          and is cleared when you close or refresh the tab.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="hosting-heading">
        <h2 id="hosting-heading" class="privacy__section-title">Hosting and network delivery</h2>
        <p>
          Static site files (HTML, JavaScript, CSS) are served through
          <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare</a>
          Pages. Like most hosting providers, Cloudflare may process standard connection data
          (such as IP address, user agent, and requested URL) to deliver the site, provide security,
          and generate aggregate analytics in our Cloudflare dashboard. We do not use that data to
          identify individual users or to access your converted files.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="analytics-heading">
        <h2 id="analytics-heading" class="privacy__section-title">Website analytics</h2>
        <p>
          We use
          <a href="https://plausible.io" target="_blank" rel="noopener noreferrer">Plausible Analytics</a>
          to understand aggregate traffic (page views, referrers, countries, devices, and browsers).
          Plausible is configured for this site without cookies and without collecting personal data
          for advertising profiles. See the
          <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer">Plausible privacy policy</a>
          for how they process data.
        </p>
        <p>
          Analytics requests go to Plausible&rsquo;s servers and may include your IP address in
          truncated form, user agent, and the page URL you visit. They do <strong>not</strong>
          receive your video files or conversion data.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="cookies-heading">
        <h2 id="cookies-heading" class="privacy__section-title">Cookies and similar technologies</h2>
        <p>
          We do not use advertising cookies. Plausible Analytics on this site does not rely on
          persistent tracking cookies. Theme preference is stored locally as described above. If we
          add advertising in the future, we will update this policy first.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="children-heading">
        <h2 id="children-heading" class="privacy__section-title">Children&rsquo;s privacy</h2>
        <p>
          NoUploadVideo is not directed at children under 13. We do not knowingly collect personal
          information from children.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="responsibility-heading">
        <h2 id="responsibility-heading" class="privacy__section-title">Your responsibility</h2>
        <p>
          You are responsible for ensuring you have the right to convert and download any content
          you process. See also the disclaimer on our
          <a routerLink="/licenses">Licenses</a> page.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="changes-heading">
        <h2 id="changes-heading" class="privacy__section-title">Changes to this policy</h2>
        <p>
          We may update this page from time to time. The &ldquo;Last updated&rdquo; date at the top
          will change when we do. Continued use of the site after an update means you accept the
          revised policy.
        </p>
      </section>

      <section class="privacy__section" aria-labelledby="contact-heading">
        <h2 id="contact-heading" class="privacy__section-title">Contact</h2>
        <p>
          Questions about this policy can be raised via the
          <a
            href="https://github.com/Joaovvb/NoUploadVideo/issues"
            target="_blank"
            rel="noopener noreferrer"
          >GitHub issues</a>
          page for this project.
        </p>
      </section>

      <a routerLink="/video-converter" class="privacy__back">&larr; Back to converter</a>
    </article>
  `,
  styleUrl: './privacy.page.scss',
})
export class PrivacyPage implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly lastUpdated = 'June 11, 2026';

  ngOnInit(): void {
    this.title.setTitle('Privacy Policy — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content:
        'How NoUploadVideo handles your data: local-only video conversion, no uploads, no accounts, and no analytics trackers.',
    });
  }
}
