# Tanka (短歌) — Autonomous Cognitive Study Platform

> **An editorial-grade, autonomous study engine and high-retention examination platform powered by multimodal AI, active recall, and adaptive learning loops.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey.svg)](https://sqlite.org)
[![KaTeX](https://img.shields.io/badge/KaTeX-Math-pink.svg)](https://katex.org)
[![9Router](https://img.shields.io/badge/AI_Gateway-9Router-black.svg)](https://github.com/decolua/9router)

---

## 1. Overview

**Tanka** is an intelligent, distraction-free study environment designed to transform raw learning materials—lecture slides, textbooks, research papers, and handwritten notes—into cohesive, high-retention mastery systems.

Unlike conventional flashcard or quiz generators that produce superficial summaries and arbitrary questions, Tanka performs an exhaustive **document audit** to extract atomic conceptual units, construct rigorous multi-tiered evaluation matrices, track misconceptions across sessions, and enrich core texts with real-time web research.

Built according to strict **anti-slop editorial design standards**, Tanka eliminates visual noise, decorative fluff, and distracting gamification in favor of a warm alabaster canvas, deep moss ergonomics, Swiss typography, and clean mathematical typesetting.

---

## 2. Core Pillars & Architecture

### A. Multi-Source Ingestion & Document Fusion
* **Universal Multi-File Bundling**: Ingest multi-file bundles simultaneously (`.pdf`, `.pptx`, `.docx`, `.txt`, `.md`, and high-resolution camera photos/scans).
* **Automated Python Parsing Subsystem**: Powered by headless fallback extractors (`pypdf`, `python-docx`, `python-pptx`, and PIL OCR pipelines) to preserve outline hierarchies and equations.
* **Intelligent Title & Concept Discovery**: Autonomously infers precise, concise academic titles from multi-chapter texts.

### B. 9Router Real-Time Web Research & Enrichment
* **Web Search Integration**: Connects with 9Router's `/v1/search` endpoint (Tavily, Brave, Exa, SearXNG) to scour the web for supplementary references, real-world case studies, and historical contexts.
* **Curriculum Expansion**: Automatically bridges curriculum gaps in uploaded documents without requiring manual prompt engineering.

### C. Active Recall & The Minimum Information Principle
* **Dynamic Atomic Flashcards**: Eliminates artificial card limits (`count = 6`). Tanka conducts a 100% conceptual coverage audit, extracting as many atomic cards as the material requires (e.g., 8–25+ cards).
* **Cognitive Load Optimization**: Strictly follows SuperMemo / Anki formulation rules:
  * **Front (Stimulus)**: Key term, theorem, or trigger condition (3–8 words max, zero multi-step calculation sprawl).
  * **Back (Recall)**: Precise definition, equation, or core rule (1–2 concise sentences).
* **3D Tactile Card Deck**: Spatial flipping with keyboard navigation (`Space` to flip, `Arrow` keys to navigate).

### D. Multi-Tiered Examination Engine & Adaptive Remedial Loop
* **Dual-Tier Quiz Matrices**:
  * **Conceptual & Textual (School & Daily Tests)**: Direct verification of definitions, processes, and rules without contrived traps.
  * **Deep Analytical & Exam Prediction (HOTS & Competitive Entrance)**: Multi-variable synthesis, cause-and-effect reasoning, and granular prediction of high-stakes exam traps.
* **Standardized 5-Option Format (A–E)**: Backend Fisher-Yates shuffling ensures balanced distribution across all options.
* **Remedial Mistake Notebook**: Incorrect answers and recorded misconceptions automatically feed back into subsequent quiz generation cycles to guarantee mastery of weak spots.
* **Dual Exam Modes**:
  * **Study Mode**: Instant step-by-step diagnostic breakdown (Key Formulas, Solution Steps, Trap Alerts).
  * **CBT Tryout Mode**: Timed exam simulator with flag question functionality, jump matrix, and score audits.

### E. Adaptive Summary Synthesis
* **Style Selector**:
  * **Simple & Intuitive**: Accessible prose with real-world analogies, retaining 100% of facts with zero conceptual loss.
  * **Memorization & Rapid Review**: Dense bullet points, classification matrices, and high-yield exam mnemonics.
  * **Formal Academic**: Comprehensive hierarchical concept maps and rigorous theoretical analysis.
* **Context-Aware Math Sanitizer**: Equations are automatically formatted via KaTeX (`\frac{a}{b}`, `\sqrt{x}`); formula requirements are cleanly bypassed for humanities and qualitative subjects.

### F. The Feynman Evaluation Protocol
* An interactive simulation where learners explain concepts in their own words.
* **Nara AI Tutor** evaluates the explanation across three pillars:
  * Conceptual accuracy.
  * Clarity and use of intuitive analogies.
  * Identification of blind spots or unverified assumptions.

---

## 3. Design System & Aesthetics

Tanka adheres to the **Editorial Anti-Slop Design Specification**:

| Element | Specification | Rationale |
| :--- | :--- | :--- |
| **Canvas Palette** | Warm Alabaster (`#eef1eb` / `#f8f9f5`) | Reduces optical fatigue compared to stark `#ffffff` or muddy dark themes |
| **Sidebar & Accents** | Deep Moss (`#18221f`) & Electric Lime (`#c8f064`) | Grounded editorial atmosphere with high-contrast functional focus |
| **Typography** | **Manrope** (Headings / UI), **DM Mono** (Formulas / Code) | Strict geometric legibility with zero decorative serif clutter |
| **Shape Lock** | Containers: `12px` \| Buttons/Inputs: `8px` \| Badges: `999px` | Harmonious geometric consistency across viewports |
| **Publication Ready** | Native `@media print` Stylesheet | Automatically strips web chrome for publication-grade physical printing and PDF export |

---

## 4. Tech Stack

* **Frontend**: React 19, TypeScript, Vite 8, Lucide Icons, KaTeX, React-Markdown, Remark-Math, Rehype-KaTeX.
* **Backend**: Node.js Native HTTP / REST, SQLite (`better-sqlite3`), Python 3 text extraction runtime.
* **AI Orchestration**: Universal Gateway via [9Router](https://github.com/decolua/9router) (`http://127.0.0.1:20128/v1`), supporting Gemini 3.8 Flash/Pro, Claude 3.7 Sonnet/Opus, and open-source foundation models.

---

## 5. Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **Python** >= 3.10
* **Dependencies for Python Extractor**:
  ```bash
  pip install pypdf python-docx python-pptx pillow
  ```
* Running **9Router** instance on `http://127.0.0.1:20128/v1` (or any OpenAI-compatible endpoint).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kaarlyz/Tanka.git
   cd Tanka
   ```

2. **Install frontend and backend dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your local or remote AI gateway:
   ```env
   NINEROUTER_URL=http://127.0.0.1:20128/v1
   NINEROUTER_API_KEY=your_key_here
   PORT=3001
   ```

4. **Build the production bundle**:
   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm start
   ```
   Open `http://localhost:3001` in your browser.

---

## 6. Project Structure

```
Tanka/
├── src/
│   ├── App.tsx             # Primary application component & reactive state machine
│   └── main.tsx            # React 19 entrypoint
├── server.js               # Node.js REST server, SQLite schema & 9Router AI orchestrator
├── extract_text.py         # Multi-format document parser (PDF, PPTX, DOCX, OCR)
├── index.html              # Shell template, typographic styles, @media print rules
├── package.json            # Dependencies & build scripts
├── vite.config.ts          # Vite build pipeline
├── taste-SKILL.md          # Anti-slop design specifications & editorial constraints
├── .env.example            # Environment template
└── LICENSE                 # MIT License
```

---

## 7. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with precision by **Kaaaxyws** & the Tanka Core Team (2026).
