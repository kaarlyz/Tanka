# Tanka (短歌) — Autonomous Adaptive Learning Platform

> **An editorial-grade, autonomous study engine and high-retention examination platform powered by multimodal AI, active recall, adaptive curriculum pipelines, and grounded pedagogical loops.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL--Mode-lightgrey.svg)](https://sqlite.org)
[![KaTeX](https://img.shields.io/badge/KaTeX-0.16.21-pink.svg)](https://katex.org)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple.svg)](public/manifest.json)
[![9Router](https://img.shields.io/badge/AI_Gateway-9Router-black.svg)](https://github.com/decolua/9router)

---

## 1. Overview

**Tanka** is an intelligent, distraction-free study environment designed to transform raw learning materials—lecture notes, textbooks, YouTube videos, exam sheets, and handwritten camera photos—into cohesive, high-retention mastery systems.

Unlike conventional flashcard or quiz generators that produce superficial summaries and hallucinations, Tanka performs an exhaustive **multi-stage curriculum synthesis**:
1. Grounded web validation via national curriculum sources (Ruangguru, Wikipedia).
2. Domain-adaptive generation separating academic exact sciences from practical growth (mindset, business, self-dev).
3. Strict mathematical rendering via isolated KaTeX.
4. Active recall ecosystems with micro-batched HOTS quizzes and isolated spaced repetition decks.

Built according to strict **anti-slop editorial design standards**, Tanka eliminates visual noise, decorative fluff, and toxic gamification in favor of a warm alabaster canvas, deep moss ergonomics, Swiss typography, and clean mathematical typesetting.

---

## 2. Core Pillars & Architecture

### A. Multi-Source Ingestion & Document Fusion
* **Universal Multi-File Bundling**: Ingest files simultaneously (`.pdf`, `.pptx`, `.docx`, `.xlsx`, `.txt`, `.md`, and raw camera photos).
* **Robust Multi-Format Extractor (`extract_text.py`)**:
  * Native XML streaming parser for Excel sheets (`.xlsx`).
  * ImageMagick auto-transcoding for iPhone HEIC/AVIF camera blobs.
  * Headless LibreOffice conversion for legacy Office docs (`.doc`, `.ppt`).
  * Hybrid PDF extractor with per-page Tesseract OCR fallback.
* **Client-Side Canvas Compression**: High-resolution smartphone photos (5–15 MB) are automatically compressed on an HTML5 canvas to $\le 600\text{ KB}$ (max dimension 1600px, JPEG quality 0.82) to prevent mobile timeout drops.
* **Parallel OCR Vision Concurrency**: Processes multi-page photos concurrently (concurrency 4), slashing upload extraction time from 54s down to $\sim 16\text{s}$.

### B. YouTube Ingestion & Adaptive Domain Pipeline
* **Dedicated Extraction Subsystem (`extract_youtube.py`)**: Pulls video metadata via oEmbed/yt-dlp and parses multilingual timestamped transcripts via `youtube-transcript-api` in an isolated virtual environment (`.venv`).
* **Adaptive Domain Classification (`detectDomainCategory`)**:
  * **Academic / Exact Science Mode**: Curricular proofs, reverse substitution ($x = x' - a$), 4 transformation pillars, UTBK worked examples, and strict KaTeX equations.
  * **Practical Growth Mode (Self-Dev, Business, Podcasts)**: Focuses on Core Thesis, Mental Models, Reality Filters (debunking clickbait), Beginner Pitfalls, and Actionable Step-by-Step Playbooks for young adults (ages 15–20), strictly eliminating contrived school exams and fictional formulas.

### C. Two-Pass V3 Autonomous Curriculum Pipeline
* **Pass 1 (Canonical Concept Extraction)**:
  * Performs grounded queries against verified educational sources.
  * Extracts atomic, incontrovertible facts directly into `document_concepts` and `document_segments`.
* **Pass 2 (Modular Synthesis)**:
  * Generates structured chapter modules referencing verified conceptual anchors with strict anti-hallucination isolation.
* **In-Place Chapter Restructuring**: Interactive *"Sesuaikan Bab / Revisi (AI)"* drawer allows targeted chapter modifications directly without regenerating the entire curriculum.

### D. Active Recall & The Minimum Information Principle
* **Dynamic Atomic Flashcards**: Eliminates artificial card limits; extracts atomic cards strictly adhering to SuperMemo/Anki principles (1 card = 1 atomic fact).
* **3D Tactile Card Deck**: Spatial flipping with keyboard shortcuts (`Space` to flip, `Arrow` keys to navigate) and instant *"Lewati / Langsung Next"* skipping.
* **Dual-Tier HOTS Quizzes with Micro-Batching**:
  * Micro-batching architecture generates up to 20 comprehensive questions in parallel batches, preventing token truncation crashes.
  * Standardized 5-Option format (A–E) with Fisher-Yates shuffling.
  * **Hidden Formula Cards**: Formula hints remain concealed during testing and reveal only upon answering.
  * **Remedial Mistake Notebook**: Incorrect answers feed back into focused remedial review cycles.

### E. Interactive Tutor: "Tanya Nara"
* **The Explainer Mandate**: Warm, conversational, highly articulative tutor persona (temperature 0.65) designed for high school and university students.
* **Document Session Isolation**: Every module maintains its own isolated conversation history (`tanka_chat_${docId}`), plus a `global` room for general study discussions.
* **Dual-Layer Persistence**: Instant zero-flicker loading via `localStorage` backed by persistent server-side synchronization in SQLite (`chat_messages`).
* **1-Click Copy to Clipboard**: Dedicated copy button with real-time visual confirmation on both user prompts and assistant replies.
* **9Router Token-Saver Bypass**: Automatically sends `x-9router-token-saver: off` header, ensuring 9Router's global compression modes (Caveman/Ponytail) never truncate pedagogical explanations.

### F. Ergonomics & Module Management
* **Bulk Module Deletion**: 1-click protected bulk deletion with cascading cleanup across documents, segments, concepts, quizzes, flashcards, mistakes, and chat logs.
* **Real-Time Module Search**: Instant client-side search bar in both the left Sidebar and Home Hub shelf.
* **Web Audio API Pomodoro Synthesizer**: Polyphonic study alarm synthesizer (warm C-Major chord) generated entirely in code via Web Audio API—zero external audio assets or network requests.
* **Progressive Web App (PWA)**: Fully installable standalone PWA with offline Service Worker caching and custom mobile icons.

---

## 3. Tech Stack

* **Frontend**: React 18, TypeScript, Vite 8, Lucide Icons, KaTeX 0.16.21, React-Markdown, Remark-Math, Rehype-KaTeX.
* **Backend**: Node.js Native HTTP (`node:http` zero-dependency server), SQLite (`better-sqlite3`, WAL mode), Python 3.14 / `uv` runtime.
* **AI Gateway**: [9Router](https://github.com/decolua/9router) (`http://127.0.0.1:20128/v1`), compatible with Gemini 3.8, Claude 3.7, and DeepSeek models.
* **PWA & Hosting**: Web App Manifest, Service Worker, Cloudflare Tunnel integration.

---

## 4. Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **Python** >= 3.10 with `uv`
* Running **9Router** instance on `http://127.0.0.1:20128/v1` (or any OpenAI-compatible endpoint).

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kaarlyz/Tanka.git
   cd Tanka
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Set up Python Virtual Environment**:
   ```bash
   uv venv .venv
   source .venv/bin/activate
   uv pip install youtube-transcript-api pypdf python-docx python-pptx pillow
   ```

4. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   NINEROUTER_URL=http://127.0.0.1:20128/v1
   NINEROUTER_API_KEY=your_key_here
   PORT=3001
   ```

5. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```
   Open `http://localhost:3001` (or install as PWA via your browser's install prompt).

---

## 5. Project Structure

```
Tanka/
├── public/
│   ├── manifest.json            # PWA Web App Manifest
│   ├── sw.js                    # PWA Service Worker (offline caching)
│   └── icons/                   # App icons (192px, 512px)
├── src/
│   ├── components/
│   │   ├── common/              # MathView (KaTeX isolation), UI atoms
│   │   ├── layout/              # Sidebar (module search & bulk delete), TopBar
│   │   ├── modals/              # TanyaNaraPanel, YouTubeModal, TopicModal
│   │   └── tabs/                # HomeHubTab, MaterialTab, QuizTab, FlashcardsTab...
│   ├── hooks/                   # useChat, useDocuments, useStudyTimer...
│   ├── types/                   # TypeScript domain models
│   ├── App.tsx                  # Root state machine & view router
│   └── main.tsx                 # React DOM mount point
├── server/
│   ├── routes/                  # documents.js, chat.js, quizzes.js, flashcards.js...
│   ├── services/                # curriculumPipeline.js (Two-Pass V3 & Adaptive Domain)
│   ├── prompts/                 # nara.js (Global Persona & Explainer Mandate)
│   ├── utils/                   # jsonParser.js (KaTeX-safe resilient parser)
│   └── ai.js                    # 9Router client & search grounding
├── extract_text.py              # Multi-format document parser (XLSX, DOCX, HEIC, OCR)
├── extract_youtube.py           # YouTube metadata & transcript parser CLI
├── tanka.sqlite                 # Production SQLite database (WAL mode)
├── vite.config.ts               # Vite bundler configuration
└── package.json                 # Project manifest & build commands
```

---

## 6. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with care by **Kaaaxyws** & the Tanka Core Team.