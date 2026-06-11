import { copyFileSync, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = '0.12.6';

async function download(url, dest) {
  if (existsSync(dest)) {
    return;
  }

  console.log(`Downloading ${url}...`);
  await new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url} (HTTP ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function setupVariant({ name, npmPackage, unpkgBase }) {
  const outputDir = join(root, 'public', name);
  const jsSource = join(root, 'node_modules', npmPackage, 'dist', 'esm', 'ffmpeg-core.js');
  const workerSource = join(root, 'node_modules', npmPackage, 'dist', 'esm', 'ffmpeg-core.worker.js');

  mkdirSync(outputDir, { recursive: true });
  copyFileSync(jsSource, join(outputDir, 'ffmpeg-core.js'));

  if (existsSync(workerSource)) {
    copyFileSync(workerSource, join(outputDir, 'ffmpeg-core.worker.js'));
  }

  await download(
    `${unpkgBase}/ffmpeg-core.wasm`,
    join(outputDir, 'ffmpeg-core.wasm'),
  );
}

await setupVariant({
  name: 'ffmpeg',
  npmPackage: '@ffmpeg/core',
  unpkgBase: `https://unpkg.com/@ffmpeg/core@${version}/dist/esm`,
});

await setupVariant({
  name: 'ffmpeg-mt',
  npmPackage: '@ffmpeg/core-mt',
  unpkgBase: `https://unpkg.com/@ffmpeg/core-mt@${version}/dist/esm`,
});

console.log('FFmpeg assets ready in public/ffmpeg/ and public/ffmpeg-mt/');
