# Guia de Contribuição — NoUploadVideo

Como contribuir com o projeto e como adicionar novos formatos de conversão.

---

## Índice

1. [Antes de começar](#1-antes-de-começar)
2. [Setup do ambiente](#2-setup-do-ambiente)
3. [Fluxo de trabalho](#3-fluxo-de-trabalho)
4. [Convenções de código](#4-convenções-de-código)
5. [Como adicionar um novo formato](#5-como-adicionar-um-novo-formato)
6. [Como adicionar uma página SEO](#6-como-adicionar-uma-página-seo)
7. [Como adicionar uma estratégia FFmpeg](#7-como-adicionar-uma-estratégia-ffmpeg)
8. [Como estender o WebCodecs fast path](#8-como-estender-o-webcodecs-fast-path)
9. [Testes](#9-testes)
10. [Checklist antes do PR](#10-checklist-antes-do-pr)

---

## 1. Antes de começar

### Princípios do projeto

- **Privacidade primeiro** — nenhum upload para servidor
- **Mínima mudança** — alterações focadas, sem refatoração desnecessária
- **Worker para processamento pesado** — nunca rodar FFmpeg na main thread
- **Tipagem estrita** — evitar `any`
- **Signals** — preferir signals para inputs, outputs e estado

### Documentação relacionada

| Documento | Conteúdo |
|-----------|----------|
| [DOCUMENTATION.md](DOCUMENTATION.md) | Referência completa |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diagramas e fluxos |

---

## 2. Setup do ambiente

```bash
git clone <repo-url>
cd NoUploadVideo
npm install          # roda setup:ffmpeg via postinstall
npm start            # http://localhost:4200
```

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Chrome ou Edge (para testes com multi-thread)

### Verificar multi-thread no dev

Abra o console em `http://localhost:4200`:

```javascript
console.log(crossOriginIsolated); // deve ser true
```

Se `false`, verifique os headers em `angular.json` → `serve.options.headers`.

---

## 3. Fluxo de trabalho

1. Crie uma branch a partir da main: `feat/nome-da-feature`
2. Faça alterações pequenas e testáveis
3. Rode `npm run build` para garantir compilação
4. Rode `npm test` se alterou lógica testável
5. Abra PR com descrição clara do **porquê** da mudança

### Commits

Use mensagens descritivas em inglês ou português, focadas no propósito:

```
feat: add webm output format support
fix: correct progress mapping during remux phase
docs: add architecture diagrams
```

---

## 4. Convenções de código

### Angular

| Item | Convenção |
|------|-----------|
| Componentes | Standalone, sufixo `.component.ts` |
| Serviços | `.service.ts`, `providedIn: 'root'` |
| Arquivos | kebab-case |
| Indentação | 2 espaços |
| Strings | single quotes |
| Estado | `signal()`, `computed()`, `input()`, `model()` |
| Injeção | `inject()` preferido em código novo |

### Estrutura de pastas

```
Nova feature de UI     → src/app/shared/components/<nome>/
Nova página SEO        → src/app/features/pages/<nome>/
Nova lógica de negócio → src/app/core/services/
Utilitário FFmpeg      → src/app/core/utils/
```

### Acessibilidade

- HTML semântico (`<button>`, `<nav>`, `<main>`)
- `aria-label`, `role`, `aria-live` onde o comportamento muda
- `aria-valuenow` em barras de progresso

### O que evitar

- `setTimeout` em produção e testes (usar `fakeAsync` + `tick`)
- `any` em TypeScript
- Processamento FFmpeg fora do worker
- Commits de arquivos em `public/ffmpeg*` gerados (são setup, não código)

---

## 5. Como adicionar um novo formato

Exemplo: adicionar suporte a **WebM como saída** (já existe como entrada) ou **FLV** (formato novo).

### Passo 1 — Tipos TypeScript

**Arquivo:** `src/app/core/models/conversion-format.model.ts`

```typescript
// Adicionar à union VideoFormat
export type VideoFormat = 'mp4' | 'avi' | 'mkv' | 'mov' | 'webm' | 'flv';

// OutputFormat herda automaticamente se for VideoFormat | 'mp3'
```

### Passo 2 — Constantes

**Arquivo:** `src/app/core/constants/conversion.constants.ts`

```typescript
// 1. Entrada (se aceitar upload desse formato)
export const SUPPORTED_INPUT_EXTENSIONS = [
  'avi', 'mp4', 'mkv', 'mov', 'webm', 'mp3', 'flv',
] as const;

// 2. Opção no seletor de saída
export const OUTPUT_FORMAT_OPTIONS: FormatOption[] = [
  // ...existentes
  { value: 'flv', label: 'FLV' },
];

// 3. MIME type para o Blob de download
export const MIME_TYPES: Record<string, string> = {
  // ...existentes
  flv: 'video/x-flv',
};
```

### Passo 3 — Estratégias FFmpeg

**Arquivo:** `src/app/core/utils/ffmpeg-args.ts`

Adicione um bloco em `buildConversionStrategies()`:

```typescript
if (outputFormat === 'flv') {
  return [
    {
      label: 'Remux rápido…',
      tracksEncodeProgress: false,
      args: [...input, '-c', 'copy', outputName],
    },
    {
      label: 'Transcodificando com preset rápido…',
      tracksEncodeProgress: true,
      args: [...input, ...FAST_H264, ...FAST_AAC, outputName],
    },
  ];
}
```

> **Dica:** Pesquise os codecs compatíveis com o container de saída. FLV tradicionalmente usa H.264 + AAC ou MP3. Ajuste os argumentos conforme necessário.

### Passo 4 — Upload (accept do input)

**Arquivo:** `src/app/shared/components/upload/upload.component.ts`

```typescript
readonly accept = input('video/*,.avi,.mp4,.mkv,.mov,.webm,.flv,audio/mpeg,.mp3');
```

### Passo 5 — WebCodecs (opcional)

Se o novo formato puder usar fast path, atualize `WebCodecsService.canUseForConversion()` em `src/app/core/services/webcodecs.service.ts`.

Na maioria dos casos novos (AVI, FLV, MKV como saída), **não** é elegível — pule este passo.

### Passo 6 — Testar manualmente

1. `npm start`
2. Upload de arquivo de teste
3. Selecionar o novo formato de saída
4. Verificar download e reprodução no player local
5. Testar arquivo grande (~100 MB) se aplicável

### Passo 7 — Documentação

Atualize as tabelas de formatos em:

- `docs/DOCUMENTATION.md` (seção 2)
- `README.md` (se for formato principal)

---

## 6. Como adicionar uma página SEO

Exemplo: página **WebM to MP4** em `/webm-to-mp4`.

### Passo 1 — Criar a página

**Arquivo:** `src/app/features/pages/webm-to-mp4/webm-to-mp4.page.ts`

Use uma página existente como template (ex: `avi-to-mp4.page.ts`):

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingLayoutComponent } from '../../../shared/layouts/landing-layout/landing-layout.component';
import { ConverterComponent } from '../../converter/converter.component';

@Component({
  selector: 'app-webm-to-mp4-page',
  standalone: true,
  imports: [LandingLayoutComponent, ConverterComponent],
  template: `
    <app-landing-layout
      heroTitle="WebM to MP4 Converter"
      heroSubtitle="Convert WebM videos to MP4 — fast, free, and private."
      heroBadge="WebM → MP4 · No Upload"
      converterCardTitle="Convert WebM to MP4"
      converterCardSubtitle="Upload your .webm file and download MP4."
      ctaTitle="Convert your WebM file now"
      ctaButtonLabel="Upload WebM File"
    >
      <app-converter
        [showHeader]="false"
        defaultOutputFormat="mp4"
        defaultInputFormat="webm"
      />
    </app-landing-layout>
  `,
})
export class WebmToMp4Page implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('WebM to MP4 Converter — NoUploadVideo');
    this.meta.updateTag({
      name: 'description',
      content: 'Free online WebM to MP4 converter. 100% client-side — your videos never leave your browser.',
    });
  }
}
```

### Passo 2 — Registrar rota

**Arquivo:** `src/app/app.routes.ts`

```typescript
{
  path: 'webm-to-mp4',
  loadComponent: () =>
    import('./features/pages/webm-to-mp4/webm-to-mp4.page').then((m) => m.WebmToMp4Page),
  title: 'WebM to MP4 Converter — NoUploadVideo',
},
```

### Passo 3 — Navegação

**Arquivo:** `src/app/app.component.ts`

Adicione links no header e footer:

```html
<a routerLink="/webm-to-mp4" routerLinkActive="app__nav-link--active" class="app__nav-link">
  WebM → MP4
</a>
```

### Passo 4 — Verificar validação

`ConverterComponent` usa `defaultInputFormat` para rejeitar arquivos de extensão errada naquela página. Nenhuma alteração extra necessária se o input já está em `SUPPORTED_INPUT_EXTENSIONS`.

---

## 7. Como adicionar uma estratégia FFmpeg

Estratégias ficam em `src/app/core/utils/ffmpeg-args.ts`.

### Interface

```typescript
export interface ConversionStrategy {
  label: string;           // Mensagem exibida na fila
  args: string[];          // Argumentos ffmpeg (sem 'ffmpeg')
  tracksEncodeProgress: boolean;  // true = barra avança com setProgress
}
```

### Quando usar `tracksEncodeProgress`

| Valor | Uso |
|-------|-----|
| `false` | Remux (`-c copy`) — rápido, progresso não é confiável |
| `true` | Transcodificação — barra reflete `progress` do FFmpeg |

### Ordem das estratégias

Sempre da **mais rápida** à **mais compatível**:

```
1. -c copy                    (remux)
2. -c:v copy -c:a aac         (só áudio)
3. libx264 + -c:a copy        (só vídeo)
4. libx264 + aac              (completo)
```

### Testar estratégia isolada

No worker, estratégias falham silenciosamente (`StrategyFailedError`) e passam para a próxima. Para debug, temporariamente reduza a lista a uma única estratégia e teste com arquivos conhecidos.

---

## 8. Como estender o WebCodecs fast path

**Arquivo:** `src/app/core/services/webcodecs.service.ts`

### `canUseForConversion()`

Defina regras conservadoras — só habilite quando o navegador decodifica nativamente:

```typescript
canUseForConversion(inputExt: string, outputFormat: OutputFormat): boolean {
  if (!this.isSupported() || outputFormat !== 'mp4') {
    return false;
  }
  const webCodecsFriendlyInputs = ['mp4', 'webm'];
  return webCodecsFriendlyInputs.includes(inputExt.toLowerCase());
}
```

### `convertToMp4()`

Usa `<video>` + `captureStream()` + `MediaRecorder`. Limitações:

- Sem controle fino de bitrate/codec
- Depende de suporte do navegador a `video/mp4` no MediaRecorder
- Sempre mantenha fallback para FFmpeg em `FfmpegService.convert()`

---

## 9. Testes

### Executar

```bash
npm test
```

### Padrão para novos testes

```typescript
import { TestBed, waitForAsync, fakeAsync, flush } from '@angular/core/testing';
import { createStubInstance } from 'sinon';
import { faker } from '@faker-js/faker';

describe('MyComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        { provide: MyService, useValue: createStubInstance(MyService) },
      ],
    })
    .overrideComponent(MyComponent, { set: { imports: [CommonModule] } })
    .compileComponents();
  }));
});
```

### O que testar ao adicionar formato

| Área | Caso de teste |
|------|---------------|
| `ffmpeg-args.ts` | `buildConversionStrategies()` retorna args corretos |
| `conversion.constants.ts` | Novo formato nas três constantes |
| `ConverterComponent` | Validação aceita/rejeita extensão |
| `FfmpegService` | MIME correto no Blob gerado |

---

## 10. Checklist antes do PR

### Formato novo

- [ ] Tipo em `conversion-format.model.ts`
- [ ] `SUPPORTED_INPUT_EXTENSIONS` (se entrada)
- [ ] `OUTPUT_FORMAT_OPTIONS` (se saída)
- [ ] `MIME_TYPES`
- [ ] Estratégias em `ffmpeg-args.ts`
- [ ] `accept` no `UploadComponent`
- [ ] Testado com arquivo real
- [ ] Documentação atualizada

### Página SEO nova

- [ ] Arquivo em `features/pages/<nome>/`
- [ ] Rota em `app.routes.ts`
- [ ] Links no `app.component.ts` (header + footer)
- [ ] `Title` e meta `description`
- [ ] `defaultInputFormat` no `ConverterComponent`

### Geral

- [ ] `npm run build` passa
- [ ] Sem `any` introduzido
- [ ] Sem processamento FFmpeg na main thread
- [ ] Acessibilidade preservada (ARIA, semântica)
- [ ] Escopo mínimo — sem refatoração não relacionada

---

## Exemplo completo: FLV → MP4

Resumo dos arquivos tocados:

```
src/app/core/models/conversion-format.model.ts     # + 'flv' em VideoFormat
src/app/core/constants/conversion.constants.ts     # input, output, MIME
src/app/core/utils/ffmpeg-args.ts                  # estratégias flv → mp4
src/app/shared/components/upload/upload.component.ts  # accept
src/app/features/pages/flv-to-mp4/flv-to-mp4.page.ts  # página SEO
src/app/app.routes.ts                              # rota
src/app/app.component.ts                           # nav links
docs/DOCUMENTATION.md                              # tabela de formatos
```

---

## Dúvidas frequentes

**Posso aumentar o limite de 200 MB?**

Tecnicamente sim (`MAX_FILE_SIZE_BYTES`), mas arquivos maiores aumentam risco de crash por memória no WASM. Teste bem antes de subir o limite.

**Preciso alterar o worker para novo formato?**

Não, se o formato é só uma nova combinação entrada/saída. O worker usa `payload.outputFormat` dinamicamente. Só altere o worker se precisar de lógica especial (ex: dois passos, filtros complexos).

**O FFmpeg WASM suporta todos os codecs do FFmpeg desktop?**

Não. O build WASM é uma subseleção. Consulte a [documentação ffmpeg.wasm](https://ffmpegwasm.netlify.app/) para codecs disponíveis.

---

## Referências

- [Documentação completa](DOCUMENTATION.md)
- [Arquitetura (diagramas)](ARCHITECTURE.md)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
