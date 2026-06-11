# NoUploadVideo — Arquitetura

Documento visual da arquitetura do projeto. Para referência detalhada de APIs e configuração, veja [DOCUMENTATION.md](DOCUMENTATION.md).

---

## Índice

1. [Visão em camadas](#1-visão-em-camadas)
2. [Fluxo de dados](#2-fluxo-de-dados)
3. [Pipeline FFmpeg no Worker](#3-pipeline-ffmpeg-no-worker)
4. [Estratégias de conversão](#4-estratégias-de-conversão)
5. [Comunicação Worker ↔ Main Thread](#5-comunicação-worker--main-thread)
6. [Estado da fila](#6-estado-da-fila)
7. [Decisão de motor de conversão](#7-decisão-de-motor-de-conversão)
8. [Deploy e isolamento de origem](#8-deploy-e-isolamento-de-origem)
9. [Mapa de dependências](#9-mapa-de-dependências)

---

## 1. Visão em camadas

```mermaid
flowchart TB
    subgraph UI["Presentation Layer"]
        APP[AppComponent<br/>header · nav · footer]
        PAGES[SEO Pages<br/>video-converter · avi-to-mp4 · …]
        LAYOUT[LandingLayoutComponent]
        CONV[ConverterComponent]
        SHARED[Upload · Queue · FormatSelector · …]
    end

    subgraph APP_LAYER["Application Layer"]
        QUEUE[ConversionQueueService]
        FFMPEG[FfmpegService]
    end

    subgraph INFRA["Infrastructure Layer"]
        WORKER_SVC[WorkerService]
        WEBCODECS[WebCodecsService]
        WORKER[ffmpeg.worker.ts]
        WASM[(FFmpeg WASM<br/>public/ffmpeg*)]
    end

    APP --> PAGES
    PAGES --> LAYOUT
    LAYOUT --> CONV
    CONV --> SHARED
    CONV --> QUEUE
    QUEUE --> FFMPEG
    FFMPEG --> WEBCODECS
    FFMPEG --> WORKER_SVC
    WORKER_SVC <-->|postMessage| WORKER
    WORKER --> WASM
```

### Responsabilidades por camada

```
┌────────────────────────────────────────────────────────────┐
│  FEATURES + SHARED                                          │
│  • Renderização, acessibilidade, UX                         │
│  • Validação de arquivo (tamanho, extensão)                 │
│  • Orquestração da fila na UI                               │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────┐
│  CORE — Services                                            │
│  • ConversionQueueService: estado da fila (signals)        │
│  • FfmpegService: API pública de conversão                  │
│  • WorkerService: lifecycle do Web Worker                   │
│  • WebCodecsService: fast path opcional                     │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────┐
│  CORE — Worker + Utils                                      │
│  • ffmpeg.worker.ts: execução FFmpeg off-thread             │
│  • ffmpeg-args.ts: estratégias de linha de comando          │
│  • Assets WASM servidos de public/ffmpeg*                   │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Fluxo de dados

### Do upload ao download

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Upload as UploadComponent
    participant Converter as ConverterComponent
    participant Queue as ConversionQueueService
    participant FFmpeg as FfmpegService
    participant WC as WebCodecsService
    participant WS as WorkerService
    participant WK as ffmpeg.worker

    User->>Upload: drag & drop / browse
    Upload->>Converter: filesSelected(File[])
    Converter->>Converter: validateFile()
    Converter->>Queue: addFiles()
    Note over Queue: status = queued

    User->>Converter: click Convert
    Converter->>Queue: processQueue()

    loop cada item queued
        Queue->>Queue: status = processing
        Queue->>FFmpeg: convert(file, format)

        alt elegível WebCodecs
            FFmpeg->>WC: convertToMp4()
            WC-->>FFmpeg: Blob
        else FFmpeg WASM
            FFmpeg->>WS: init() [lazy, once]
            FFmpeg->>WS: convert(payload)
            WS->>WK: postMessage(convert, transfer fileData)
            WK->>WK: FS.writeFile → strategies → FS.readFile
            WK-->>WS: complete(ArrayBuffer)
            WS-->>FFmpeg: ArrayBuffer
        end

        FFmpeg-->>Queue: Blob URL
        Queue->>Queue: status = completed
    end

    User->>Queue: Download individual ou "Baixar todos" (ZIP)
```

### Transferência de memória

```
Main Thread                          Web Worker
─────────────                          ──────────
File.arrayBuffer()
       │
       ▼
postMessage({ fileData }, [fileData]) ──►  Uint8Array no MEMFS
       │                                      │
       │ (transfer: sem cópia)               ▼
       │                                 ffmpeg exec
       │                                      │
       ◄── postMessage({ data }, [data]) ────┘
       │
       ▼
new Blob([data]) → URL.createObjectURL()
```

---

## 3. Pipeline FFmpeg no Worker

```mermaid
flowchart LR
    subgraph INIT["Init (uma vez)"]
        A[import ffmpeg-core.js] --> B[createFFmpegCore]
        B --> C[setProgress handler]
        C --> D[ready]
    end

    subgraph CONVERT["Por conversão"]
        E[writeFile input.ext] --> F{runStrategies}
        F -->|sucesso| G[readFile output.format]
        F -->|todas falharam| H[error]
        G --> I[unlink FS]
        I --> J[complete ArrayBuffer]
    end

    INIT --> CONVERT
```

### Fases de progresso

```
Progresso (%)
100 ┤                                          ████ Done
 98 ┤                                    ████ read output
 97 ┤                              ████████ encode phase
 15 ┤                         ████
 14 ┤                    ████ strategy attempts
 10 ┤               ████ start conversion
  9 ┤          ████ write file
  8 ┤     ████ engine ready
  2 ┤ ████ loading engine
  0 ┴──────────────────────────────────────────────────► tempo
```

---

## 4. Estratégias de conversão

### Saída MP4 (cascata)

```mermaid
flowchart TD
    START([input → output.mp4]) --> S1

    S1["① Remux<br/>-c copy + faststart"]
    S1 -->|exit 0| OK([✓ concluído])
    S1 -->|falha| S2

    S2["② Vídeo copy + áudio AAC<br/>-c:v copy -c:a aac"]
    S2 -->|exit 0| OK
    S2 -->|falha| S3

    S3["③ Vídeo H.264 + áudio copy<br/>libx264 ultrafast"]
    S3 -->|exit 0| OK
    S3 -->|falha| S4

    S4["④ Transcode completo<br/>libx264 + aac"]
    S4 -->|exit 0| OK
    S4 -->|falha| ERR([✗ todas falharam])

    style S1 fill:#dcfce7
    style S2 fill:#d1fae5
    style S3 fill:#fef9c3
    style S4 fill:#fee2e2
```

### Velocidade vs compatibilidade

```
Mais rápido ◄────────────────────────────────────► Mais compatível

  remux          vídeo copy        vídeo transcode      full transcode
  (-c copy)      + áudio AAC       + áudio copy         (vídeo + áudio)
     │                │                  │                    │
     ▼                ▼                  ▼                    ▼
  segundos         segundos~min       minutos              minutos+
```

---

## 5. Comunicação Worker ↔ Main Thread

```mermaid
sequenceDiagram
    participant Main as WorkerService
    participant WK as ffmpeg.worker

    Note over Main,WK: Inicialização
    Main->>WK: { type: init, coreURL, wasmURL, workerURL? }
    WK->>WK: loadEngine()
    WK-->>Main: { type: progress, progress: 2..8 }
    WK-->>Main: { type: ready, multithreaded }

    Note over Main,WK: Conversão
    Main->>WK: { type: convert, payload } + transfer fileData
    loop durante exec
        WK-->>Main: { type: progress, progress, status }
    end
    WK-->>Main: { type: complete, data } + transfer buffer

    Note over Main,WK: Erro
    WK-->>Main: { type: error, error }
```

### Tipos de mensagem

| Direção | type | Quando |
|---------|------|--------|
| → Worker | `init` | Primeira conversão (lazy load) |
| → Worker | `convert` | Cada arquivo |
| ← Worker | `ready` | Engine carregado |
| ← Worker | `progress` | Setup ou encode |
| ← Worker | `complete` | Sucesso |
| ← Worker | `error` | Falha |

---

## 6. Estado da fila

```mermaid
stateDiagram-v2
    [*] --> queued: addFiles()

    queued --> processing: processQueue() picks item
    processing --> completed: convert() OK
    processing --> error: convert() throws

    queued --> [*]: removeItem()
    completed --> [*]: removeItem() / clearCompleted()
    error --> [*]: removeItem()

    note right of processing
        progress: 0–100
        statusText: mensagem do worker
    end note

    note right of completed
        outputUrl: Blob URL
        download disponível
    end note
```

### Processamento sequencial

```
Fila: [ A.avi, B.mkv, C.mp4, D.mov ]
                │
                ▼
         ┌─────────────┐
         │ Processa A  │ ──► completed
         └─────────────┘
                │
                ▼
         ┌─────────────┐
         │ Processa B  │ ──► completed
         └─────────────┘
                │
               ...
```

> Um arquivo por vez evita múltiplas cópias de 200 MB na memória WASM.

---

## 7. Decisão de motor de conversão

```mermaid
flowchart TD
    IN([convert file, format]) --> WC_CHECK{WebCodecs<br/>elegível?}

    WC_CHECK -->|mp4/webm → mp4<br/>+ API disponível| WC_TRY[WebCodecsService.convertToMp4]
    WC_CHECK -->|não| FF[WorkerService + FFmpeg]

    WC_TRY -->|sucesso| OUT([Blob URL])
    WC_TRY -->|falha| FF

    FF --> MT{crossOriginIsolated<br/>+ SharedArrayBuffer?}
    MT -->|sim| MT_CORE[/ffmpeg-mt/ multi-thread]
    MT -->|não| ST_CORE[/ffmpeg/ single-thread]

    MT_CORE --> OUT
    ST_CORE --> OUT
```

### Matriz de elegibilidade WebCodecs

| Entrada | Saída | Motor |
|---------|-------|-------|
| MP4 | MP4 | WebCodecs → FFmpeg fallback |
| WebM | MP4 | WebCodecs → FFmpeg fallback |
| AVI | MP4 | FFmpeg apenas |
| MKV | MP4 | FFmpeg apenas |
| MOV | MP4 | FFmpeg apenas |
| qualquer | MP3 | FFmpeg apenas |
| qualquer | AVI/MKV/MOV | FFmpeg apenas |

---

## 8. Deploy e isolamento de origem

```mermaid
flowchart LR
    subgraph Browser
        APP[NoUploadVideo SPA]
        CHECK{crossOriginIsolated?}
        MT[core-mt + SharedArrayBuffer]
        ST[core single-thread]
    end

    subgraph Server["Servidor / CDN"]
        HDR["Headers COOP/COEP"]
        STATIC[dist/no-upload-video/browser/]
    end

  HDR --> APP
  STATIC --> APP
  APP --> CHECK
  CHECK -->|true| MT
  CHECK -->|false| ST
```

### Headers necessários

```
Request ──► CDN/Server
                │
                ├── Cross-Origin-Opener-Policy: same-origin
                ├── Cross-Origin-Embedder-Policy: require-corp
                │
                ▼
         crossOriginIsolated = true
                │
                ▼
         FFmpeg multi-thread ativo
```

---

## 9. Mapa de dependências

```mermaid
flowchart BT
    subgraph Pages
        VC[video-converter.page]
        AVI[avi-to-mp4.page]
        MKV[mkv-to-mp4.page]
        MOV[mov-to-mp4.page]
    end

    subgraph Features
        CONV[converter.component]
    end

    subgraph Shared
        UP[upload]
        FQ[conversion-queue]
        FS[format-selector]
        LL[landing-layout]
    end

    subgraph Core Services
        CQS[conversion-queue.service]
        FFS[ffmpeg.service]
        WSS[worker.service]
        WCS[webcodecs.service]
    end

    subgraph Core Worker
        WK[ffmpeg.worker]
        ARGS[ffmpeg-args]
        CONST[conversion.constants]
    end

    VC & AVI & MKV & MOV --> LL & CONV
    CONV --> UP & FQ & FS
    CONV --> CQS
    CQS --> FFS
    FFS --> WSS & WCS
    WSS --> WK
    WK --> ARGS
    FFS --> CONST
    FS --> CONST
```

### Regra de dependência

```
features  →  shared  →  core
   │                      │
   └──────────────────────┘  (features pode usar core diretamente)

core/workers  →  core/utils, core/models  (nunca importa Angular)
```

---

## Referências

- [Documentação completa](DOCUMENTATION.md)
- [Guia de contribuição e novos formatos](CONTRIBUTING.md)
