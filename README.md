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
- Limite de **200 MB** por arquivo

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
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagramas de arquitetura e fluxos |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Guia de contribuição e novos formatos |

## Deploy

### Cloudflare Pages (recomendado)

1. Conecte o repositório GitHub em **Workers & Pages → Create → Pages**
2. Build command: `npm install && npm run build`
3. Build output: `dist/no-upload-video/browser`
4. Variável: `NODE_VERSION` = `20`

Headers COOP/COEP e redirect SPA já estão em `public/_headers` e `public/_redirects`.

### Headers em outros hosts

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

Sem eles, o FFmpeg multi-thread não estará disponível. Detalhes em [docs/DOCUMENTATION.md#18-build-e-deploy](docs/DOCUMENTATION.md#18-build-e-deploy).

## Licença

Projeto privado (`"private": true` no package.json).
