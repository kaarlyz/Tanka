# TASK: TASK-LANDING-MOTION-POLISH-015
## MODE: VISUAL_PRODUCT
## SURFACE ARCHETYPE: Decide/Learn

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/landing/LandingPage.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Selesaikan 4 poin penyempurnaan visual, responsivitas, dan motion pada Landing Page Tanka (`src/components/landing/LandingPage.tsx`):
1. **Fix Overflow Tombol "Simulasikan"**: Cegah tombol keluar dari card `.cockpit-video-box` pada layar mobile (390px) dengan `min-width: 0` pada input, `flex-shrink: 0`, dan stacked column pada viewport mobile.
2. **Elevasi Running Text (Marquee Ticker)**: Hilangkan seluruh emoji mentah (✨, ⚡, 📚, 🎯, 📱, 🛡️), ganti dengan micro-pill badges beraksen dot hijau halus (`.marquee-indicator`) dan tipografi monospaced teknis yang berkelas dunia (Linear/Apple style).
3. **Floating Badges 3D Mockup Hero**:
   - Ganti emoji `✨` pada "Bab Santai 3 Menit" dengan icon `<BookOpen size={18} color="#4b6623" />`.
   - Ganti emoji `⚡` pada "Nara AI Siaga 24 Jam" dengan icon `<Brain size={18} color="#4b6623" />`.
   - Bungkus masing-masing dalam `.float-badge-icon-box` berlatar `#f4f7ee` dan border halus `#dce4d2`.
4. **Penyempurnaan Animasi & Motion Holistik**:
   - Berikan ambient float lembut pada 3D mockup hero (`perspective(1200px)` dengan tilt halus).
   - Animasi counter-float natural pada satellite badges (`floatSlow1` & `floatSlow2`).
   - Micro-motion hover melayang dan border glow pada `.bento-card`.
   - Haluskan transisi ganti mode di Studio Dock (`.studio-apparatus-screen`).

---

## 2. SPESIFIKASI IMPLEMENTASI DETAIL

### A. Fix Overflow Input Bar YouTube Simulator
Di dalam tag `<style>` `LandingPage.tsx`:
```css
.cockpit-input-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
}

.cockpit-input-field {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
  background: #ffffff;
  border: 1px solid #dce2da;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'DM Mono', monospace;
  color: #45544e;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cockpit-input-field:focus {
  border-color: #779f2f;
  box-shadow: 0 0 0 3px rgba(119, 159, 47, 0.15);
}

.cockpit-submit-btn {
  flex-shrink: 0;
  background: #c8f064;
  color: #18221f;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.cockpit-submit-btn:hover:not(:disabled) {
  background: #b8e64c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(200, 240, 100, 0.35);
}

.cockpit-submit-btn:active:not(:disabled) {
  transform: scale(0.97);
}

@media (max-width: 560px) {
  .cockpit-input-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .cockpit-submit-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}
```

### B. Polish Running Text (Marquee Ticker) Tanpa Emoji
1. CSS:
```css
.landing-marquee-wrapper {
  overflow: hidden;
  padding: 36px 0 16px;
  user-select: none;
  max-width: 100%;
  position: relative;
}

.landing-marquee-wrapper::before,
.landing-marquee-wrapper::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 140px;
  z-index: 2;
  pointer-events: none;
}

.landing-marquee-wrapper::before {
  left: 0;
  background: linear-gradient(to right, #fcfdfa 40%, transparent);
}

.landing-marquee-wrapper::after {
  right: 0;
  background: linear-gradient(to left, #fcfdfa 40%, transparent);
}

.landing-marquee-track {
  display: flex;
  width: max-content;
  animation: marqueeLoop 30s linear infinite;
}

.landing-marquee-track:hover {
  animation-play-state: paused;
}

.landing-marquee-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-right: 20px;
}

.marquee-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #283832;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(220, 228, 218, 0.85);
  box-shadow: 0 2px 8px rgba(24, 34, 31, 0.03);
  white-space: nowrap;
}

.marquee-dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #779f2f;
  display: inline-block;
  box-shadow: 0 0 6px rgba(119, 159, 47, 0.6);
}

.marquee-separator {
  color: #cbd5cb;
  font-size: 13px;
}
```

2. JSX (Ganti total blok marquee yang ada):
```tsx
      {/* Animated Marquee Ticker */}
      <div className="landing-marquee-wrapper reveal-scroll">
        <div className="landing-marquee-track">
          {[...Array(2)].map((_, trackIdx) => (
            <div className="landing-marquee-content" key={trackIdx}>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                PENURUNAN RUMUS KONTINU
              </span>
              <span className="marquee-separator">•</span>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                TUTOR NARA BERLATENSI 0.2MS
              </span>
              <span className="marquee-separator">•</span>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                MODUL PER BAB SIAP SANTAP
              </span>
              <span className="marquee-separator">•</span>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                KUIS DETERMINISTIK ATOMIK
              </span>
              <span className="marquee-separator">•</span>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                100% LOKAL & BEBAS DISTRAKSI
              </span>
              <span className="marquee-separator">•</span>
              <span className="marquee-pill">
                <span className="marquee-dot-pulse" />
                PEMAHAMAN BERBASIS BUKTI
              </span>
              <span className="marquee-separator">•</span>
            </div>
          ))}
        </div>
      </div>
```

### C. Floating Badges 3D Mockup dengan Icon Lucide
Di bagian mockup 3D (`mockup-break-section`):
1. CSS:
```css
.float-badge-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f4f7ee;
  border: 1px solid #dce4d2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```
2. JSX (Ganti emoji ✨ dan ⚡):
```tsx
          {/* Floating Badges */}
          <div className="hero-float-badge float-top-left">
            <div className="float-badge-icon-box">
              <BookOpen size={18} color="#4b6623" />
            </div>
            <div className="float-badge-text">
              <strong>Bab Santai 3 Menit</strong>
              <small>Otomatis dipotong ringkas</small>
            </div>
          </div>

          <div className="hero-float-badge float-top-right">
            <div className="float-badge-icon-box">
              <Brain size={18} color="#4b6623" />
            </div>
            <div className="float-badge-text">
              <strong>Nara AI Siaga 24 Jam</strong>
              <small>Tanya rumus tanpa batas</small>
            </div>
          </div>
```

### D. Polish Animasi & Motion
- Berikan `.hero-mockup-container` gaya 3D perspective yang elegan:
  `transform: perspective(1200px) rotateX(2deg);` dengan transisi halus saat hover `rotateX(0deg)`.
- Pastikan `.bento-card` memiliki hover lift `translateY(-4px)` dan border highlight zaitun `#8da868`.
- Pastikan tab switch studio dock (`.spec-content-fade`) memiliki animasi crossfade halus (`animation: studioFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both`).

---

## 3. ACCEPTANCE CRITERIA
- [ ] Tombol "Simulasikan" berada 100% di dalam kontainer card pada viewport mobile 390px (spillAmount = 0px).
- [ ] Running text marquee 100% bebas dari emoji (✨, ⚡, 📚, 🎯, dll), berganti menjadi sleek micro-pills dengan dot indicator.
- [ ] Floating badges 3D hero menampilkan icon `BookOpen` dan `Brain` di dalam `.float-badge-icon-box`.
- [ ] Animasi floating badges, marquee hover-pause, dan bento cards berjalan silky 60 FPS tanpa jank.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
