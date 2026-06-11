import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { OPEN_SOURCE_DEPENDENCIES } from '../../../core/constants/open-source-licenses.constants';

@Component({
  selector: 'app-licenses-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="licenses">
      <h1 class="licenses__title">Licenses &amp; Open Source</h1>
      <p class="licenses__lead">
        NoUploadVideo is built with open-source software. Your videos are processed locally in your
        browser — files are never uploaded to our servers.
      </p>

      <section class="licenses__section" aria-labelledby="ffmpeg-heading">
        <h2 id="ffmpeg-heading" class="licenses__section-title">FFmpeg</h2>
        <p>
          This application uses
          <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer">FFmpeg</a>
          compiled to WebAssembly via
          <a href="https://ffmpegwasm.netlify.app/" target="_blank" rel="noopener noreferrer">ffmpeg.wasm</a>.
          FFmpeg is licensed under the
          <a href="https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html" target="_blank" rel="noopener noreferrer">GNU LGPL version 2.1</a>
          or later. Depending on the build configuration, some components may be under GPL.
          See the
          <a href="https://ffmpeg.org/legal.html" target="_blank" rel="noopener noreferrer">FFmpeg legal page</a>
          for details.
        </p>
        <p>
          FFmpeg is a trademark of
          <a href="https://ffmpeg.org" target="_blank" rel="noopener noreferrer">ffmpeg.org</a>.
          NoUploadVideo is not affiliated with or endorsed by the FFmpeg project.
        </p>
        <ul class="licenses__list">
          <li>Engine version bundled in this app: <strong>0.12.6</strong> (&#64;ffmpeg/core / &#64;ffmpeg/core-mt)</li>
          <li>WASM binaries may be loaded from unpkg in production (same version as above)</li>
          <li>Source code:
            <a href="https://github.com/FFmpeg/FFmpeg" target="_blank" rel="noopener noreferrer">github.com/FFmpeg/FFmpeg</a>
          </li>
        </ul>
      </section>

      <section class="licenses__section" aria-labelledby="dependencies-heading">
        <h2 id="dependencies-heading" class="licenses__section-title">Third-party libraries</h2>
        <p>
          The table below lists the main open-source dependencies used by this web application.
        </p>
        <div class="licenses__table-wrap">
          <table class="licenses__table">
            <caption class="visually-hidden">Open-source dependencies used by NoUploadVideo</caption>
            <thead>
              <tr>
                <th scope="col">Library</th>
                <th scope="col">Version</th>
                <th scope="col">License</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              @for (dep of dependencies; track dep.name) {
                <tr>
                  <td>
                    <a [href]="dep.url" target="_blank" rel="noopener noreferrer">{{ dep.name }}</a>
                  </td>
                  <td>{{ dep.version }}</td>
                  <td>{{ dep.license }}</td>
                  <td>{{ dep.role }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="licenses__section" aria-labelledby="notice-heading">
        <h2 id="notice-heading" class="licenses__section-title">Disclaimer</h2>
        <p>
          Software is provided &ldquo;as is&rdquo;, without warranty of any kind. You are responsible
          for ensuring you have the right to convert and download any content you process with this
          tool.
        </p>
      </section>

      <a routerLink="/video-converter" class="licenses__back">&larr; Back to converter</a>
    </article>
  `,
  styleUrl: './licenses.page.scss',
})
export class LicensesPage implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly dependencies = OPEN_SOURCE_DEPENDENCIES;

  ngOnInit(): void {
    this.title.setTitle('Licenses & Open Source — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Open-source licenses and attributions for NoUploadVideo, including FFmpeg LGPL notice.',
    });
  }
}
