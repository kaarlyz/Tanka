# TASK-EXAM-CBT-PANE-COLLAPSE-IMAGE-ZOOM-066: Collapsible Wacana Pane & Responsive Full-Image Zoom Lightbox

**Status**: VERIFIED
**Assignee**: MARAKA
**Context**: Tanka AI Platform (`~/Projects/tanka`)

---

## 1. Problem Statement & User Feedback
Eka reported:
1. **Images Clipped / Cramped**:
   - Diagram images (such as math graphs, geometric figures, and science illustrations) are sometimes cut off or cramped because the 50/50 split layout restricts question column width to ~500px.
   - Option images with `maxHeight: 120` or fixed pixel dimensions clip wide diagrams.
   - Images inside raw HTML wacana/soal lack explicit `object-fit: contain` and responsive scaling.
2. **No Pane Minimization**:
   - Currently, the Left Pane (Wacana/Stimulus) always occupies 50% width even when:
     * The question has NO separate reading passage (showing an empty placeholder while the actual diagram in the right pane is cramped).
     * The user has already finished reading the passage and wants maximum focus and screen space for solving the question.
   - **Requirement**: Allow minimizing/collapsing the left pane into a compact rail/button (`[◧ Sembunyikan Wacana]` / `[◨ Tampilkan Wacana]`) so the question pane expands to **100% full width**.
   - Auto-collapse the left pane when the current question has no separate `bacaan`.
3. **Diagram Click-to-Zoom (Lightbox)**:
   - Clicking any diagram image (`soal_img`, option `img`, or embedded image) opens an unobtrusive, clean modal showing the diagram at 100% native resolution with zoom/pan so zero details are lost.

---

## 2. Implementation Specifications

### Step 1: Collapsible Wacana Pane in `src/components/tabs/ExamCbtTab.tsx`
- Add state: `const [isWacanaCollapsed, setIsWacanaCollapsed] = useState(false);`
- In header or pane toolbar, provide a toggle button:
  * When open: `<button onClick={() => setIsWacanaCollapsed(true)} title="Sembunyikan Wacana (Layar Penuh Soal)">◧ Sembunyikan Wacana</button>`
  * When collapsed: `<button onClick={() => setIsWacanaCollapsed(false)} title="Tampilkan Wacana">◨ Tampilkan Wacana</button>`
- Dynamic Grid Layout:
  * If `isWacanaCollapsed` or `(!currentItem.bacaan && !currentItem.soal_img)`:
    - Left pane is either hidden or rendered as a slim vertical badge/button.
    - Right pane (Question & Options) takes `gridTemplateColumns: "1fr"`, giving 100% full container width (up to 1200px+).
  * If not collapsed and has bacaan:
    - Retain balanced split screen `gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1.2fr)"`.

### Step 2: Global Image Sizing & Anti-Clipping
- In `CbtContentRenderer.tsx` and `ExamCbtTab.tsx`:
  * Ensure all `img` tags have:
    ```css
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain !important;
    border-radius: 8px;
    cursor: zoom-in;
    ```
  * Remove rigid height clipping (change `maxHeight: 120` on option images to `maxHeight: 260px` with `objectFit: "contain"`).

### Step 3: Interactive Lightbox Zoom Modal
- Add state `const [zoomImage, setZoomImage] = useState<{ src: string; title?: string } | null>(null);`
- Whenever any diagram or option image is clicked, set `zoomImage({ src: imageSrc, title: `Diagram Soal ${currentItem.nomor}` })`.
- Render a fixed backdrop modal with:
  * Image centered at native resolution (up to 90vw / 85vh).
  * Close button & click outside to close.
  * Clear title and zoom hint.

---

## 3. Verification Criteria
- [x] Left pane can be toggled collapsed/expanded. When collapsed, question pane expands to full width.
- [x] Questions without bacaan auto-expand question pane to full width without taking up blank left space.
- [x] Diagrams scale responsively with `object-fit: contain` without any horizontal or vertical clipping.
- [x] Clicking any diagram opens the high-res zoom modal.
- [x] `npm test` passes 160/160.
- [x] `npm run build` succeeds cleanly.

---

## 4. Evidence Artifacts
- Files Modified:
  * `src/components/tabs/ExamCbtTab.tsx`
  * `src/components/common/CbtContentRenderer.tsx`
  * `src/index.css`
  * `tests/cbtContentRenderer.test.js`
- Screenshots:
  * `.agents/evidence/TASK-066-desktop-cbt-collapse-1920x1080.png`
  * `.agents/evidence/TASK-066-desktop-cbt-lightbox-zoom.png`
  * `.agents/evidence/TASK-066-mobile-cbt-390x844.png`
- DOM Probes:
  * Desktop (1920x1080): 0 overflowing elements
  * Mobile (390x844): 0 overflowing elements
