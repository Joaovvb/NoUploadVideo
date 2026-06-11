# NoUploadVideo

Conversor de vídeo no navegador com **FFmpeg WebAssembly**. Processamento 100% local — sem upload, sem servidor.

## Funcionalidades

- Conversão entre **AVI, MP4, MKV, MOV, WebM** e extração de **MP3**
- Upload por drag & drop (múltiplos arquivos)
- Fila de conversão com progresso, download individual e **baixar todos em ZIP**
- Indicador **Baixado** por arquivo após download
- FFmpeg em **Web Worker** (UI responsiva)
- **Multi-thread** quando Cross-Origin Isolation está ativo
- **WebCodecs** como fast path para MP4/WebM → MP4
- Rotas SEO: `/avi-to-mp4`, `/mkv-to-mp4`, `/mov-to-mp4`
- Página de licenças: `/licenses` (FFmpeg LGPL + dependências open source)
- Modo escuro com preferência salva no navegador
- Limite de **200 MB** por arquivo

**Site em produção:** https://nouploadvideo.com ([alternativo](https://nouploadvideo.pages.dev))

## Stack

- Angular 19 (standalone, signals, strict TypeScript)
- `@ffmpeg/core` + `@ffmpeg/core-mt` 0.12.6
- RxJS · SCSS · JSZip (download em lote)

## Início rápido

```bash
npm install
npm run setup:ffmpeg   # automático no postinstall
npm start
```

Abra [http://localhost:4200](http://localhost:4200).

## Build

```bash
npm run build
```

Saída: `dist/no-upload-video/browser/`

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) | Referência completa do projeto |
| [docs/ROADMAP.md](docs/ROADMAP.md) | O que foi feito e o que falta |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagramas de arquitetura e fluxos |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Guia de contribuição e novos formatos |

## Deploy

### Cloudflare Pages (recomendado)

1. Conecte o repositório GitHub em **Workers & Pages → Create → Pages**
2. Build command: `npm install && npm run build`
3. Build output: `dist/no-upload-video/browser`
4. Variável: `NODE_VERSION` = `20`

Headers COOP/COEP, segurança (`X-Content-Type-Options`, `Referrer-Policy`) e redirect SPA já estão em `public/_headers` e `public/_redirects`.

**Domínio customizado:** Cloudflare Registrar → `nouploadvideo.com` + `www` em Custom domains do projeto Pages.

**Redirects canônicos:** `www` → apex via Redirect Rule na Cloudflare; `nouploadvideo.pages.dev` → `.com` via `functions/_middleware.js`.

**SEO:** `public/sitemap.xml` + `public/robots.txt` (enviar o sitemap no Google Search Console).

Arquivos WASM (~31 MiB) excedem o limite de 25 MiB do Cloudflare Pages e são carregados via CDN (unpkg) em runtime. Apenas os `.js` do FFmpeg vão no bundle de deploy.

Use `npx npm@10.9.2 install` localmente para manter o `package-lock.json` compatível com o `npm ci` da Cloudflare.

### Headers em outros hosts

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

Sem eles, o FFmpeg multi-thread não estará disponível. Detalhes em [docs/DOCUMENTATION.md#18-build-e-deploy](docs/DOCUMENTATION.md#18-build-e-deploy).

## Licenças e open source

Este projeto usa [FFmpeg](https://ffmpeg.org) (LGPL) e outras bibliotecas open source. Atribuições completas: [/licenses](https://nouploadvideo.com/licenses) (ou `http://localhost:4200/licenses` em dev).

O footer do site exibe **Powered by FFmpeg** com link para ffmpeg.org.

Repositório npm privado (`"private": true` no `package.json`) — isso não impede o site público nem a página de licenças.
