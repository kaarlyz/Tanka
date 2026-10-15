# TASK: TASK-FLASHCARD-POLISH-037
## MODE: HYBRID
## SURFACE ARCHETYPE: Comparison Flashcard Scroll Polish & Intersection Reveal Optimization

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/landing/LandingPage.tsx`
  - `src/components/landing/landing.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pada audit visual independen AURA untuk 3D Comparison Flashcards:
1. **IntersectionObserver Proaktif**: Pada `LandingPage.tsx`, `rootMargin: "0px 0px -40px 0px"` dengan `threshold: 0.08` dapat menahan `reveal-scroll` pada status `opacity: 0` ketika halaman digulir cepat atau diakses melalui loncatan URL hash.
   - Solusi: Ubah `threshold` menjadi `0.01` dan `rootMargin` menjadi `"120px 0px 40px 0px"` agar elemen memicu animasi masuk lebih awal sebelum menabrak viewport, dan fallback CSS memastikan konten tetap aman terbaca.
2. **Scroll Margin Top untuk Sticky Navbar**: Ketika anchor link `#perbandingan` atau bagian lain diklik, judul section sempat tertutup oleh sticky navbar 68px.
   - Solusi: Berikan `scroll-margin-top: 96px !important` pada `.landing-section` di `src/components/landing/landing.css`.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

1. Di `src/components/landing/LandingPage.tsx`:
   Perbarui konfigurasi observer:
   ```tsx
   const observer = new IntersectionObserver(
     (entries) => {
       entries.forEach((entry) => {
         if (entry.isIntersecting) {
           entry.target.classList.add("is-revealed");
         }
       });
     },
     {
       root: containerRef.current,
       threshold: 0.01,
       rootMargin: "120px 0px 40px 0px"
     }
   );
   ```

2. Di `src/components/landing/landing.css`:
   Pastikan `.landing-section` memiliki:
   ```css
   .landing-section {
     position: relative;
     padding: clamp(64px, 7vw, 112px) clamp(20px, 4vw, 48px);
     max-width: 1280px;
     margin: 0 auto;
     box-sizing: border-box;
     scroll-margin-top: 96px !important;
   }
   ```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Navigasi anchor ke `#perbandingan` menempatkan judul section persis di bawah sticky navbar dengan margin lega 28px+.
- [ ] Seluruh elemen flashcard ter-reveal secara instan dan tidak ada elemen berstatus `opacity: 0` saat digulir.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 85/85 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
