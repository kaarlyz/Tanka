# TASK-SIDEBAR-DESKTOP-COLLAPSIBLE-RAIL-067: Desktop Collapsible Sidebar Rail & Maximize Workspace Width

**Status**: VERIFIED
**Assignee**: MARAKA
**Context**: Tanka AI Platform (`~/Projects/tanka`)

---

## 1. Problem Statement & User Requirement
Eka clarified:
*"panel menu kita kalau didesktop itu mksdnya yg bisa di minimize"*
- On desktop, the main navigation sidebar (`.figma-sidebar`) takes a rigid 260px width.
- In workspace intensive tabs (especially `cbt` Simulasi CBT, `material` Reading Tab, and `quiz` Latihan Kuis), this 260px sidebar consumes significant screen real estate.
- **Requirement**:
  1. Add a toggle button on the desktop sidebar (e.g. adjacent to the brand logo or top bar, using `ChevronLeft` / `ChevronRight` or `PanelLeftClose` / `PanelLeftOpen` icon) allowing users to collapse the sidebar into an **Icon-Only Rail** (width: 68px) or expand back to 260px.
  2. In collapsed rail state:
     - Sidebar width shrinks to 68px.
     - Brand shows compact logo mark ("t.").
     - Nav buttons show centered side-mark chips ("H", "C", "M", "L", "B", "K", "F") with badges and clear tooltips on hover.
     - Bottom profile box collapses to avatar circle.
     - Workspace content area automatically gains +192px width, maximizing space for CBT split panes, math formulas, and diagrams!
  3. Persist collapse state in `localStorage` (`tanka_desktop_sidebar_collapsed`).
  4. Ensure mobile drawer behavior (<= 768px) remains completely unaffected.

---

## 2. Implementation Specifications

### Step 1: State & Toggle in `src/App.tsx` & `src/components/layout/Sidebar.tsx`
- In `Sidebar.tsx`:
  * Add prop `isDesktopCollapsed?: boolean; onToggleDesktopCollapse?: () => void;`
  * Add toggle button in brand header:
    `<button onClick={onToggleDesktopCollapse} className="sidebar-collapse-toggle desktop-only" title={isDesktopCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar (Layar Penuh)"}>...`
  * Conditional styling for collapsed mode:
    - `width: isDesktopCollapsed ? 68 : 260`
    - Hide text labels (`span`) when collapsed, keep marks centered.
    - Compact avatar and compact action buttons.

### Step 2: Styling in `src/index.css`
- Smooth transition: `transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), padding 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;`
- Rail styling: `width: 68px !important; padding: 14px 8px 10px !important;` under `@media (min-width: 769px)`.
- Clean icon-rail hover tooltips & active side-mark highlight.

### Step 3: Verification Evidence
- `npm test` passes 163/163 (including `tests/desktopCollapsibleSidebar.test.js`).
- `npm run build` succeeds (dist built in 467ms).
- Browser DOM evaluation (`browser_exec`):
  * Initial desktop width: 260px (`isCollapsed: false`, `localStorageVal: null`).
  * Toggled collapsed width: 68px (`isCollapsed: true`, `localStorageVal: 'true'`).
  * Horizontal overflow: `0` elements (`overflowCount: 0`).
  * Extra workspace gain: +192px cleanly utilized by CBT grid and materials.
  * Mobile check (390x844): toggle button hidden (`desktop-only`), drawer structure intact.
- Vision analysis on evidence screenshots:
  * `.agents/evidence/TASK-067-desktop-sidebar-collapsed-68px.png`: Confirmed 68px rail, compact logo mark "t.", centered side-mark chips, zero visual defects.
  * `.agents/evidence/TASK-067-desktop-cbt-expanded-workspace.png`: Confirmed 4-column CBT package grid consuming reclaimed +192px width evenly, zero overflow.
  * `.agents/evidence/TASK-067-desktop-sidebar-expanded-260px.png`: Confirmed seamless transition back to 260px.
  * `.agents/evidence/TASK-067-mobile-drawer-check.png`: Confirmed mobile drawer immunity.
