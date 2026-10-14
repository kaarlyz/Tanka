# TASK: TASK-PILOT-HERO-MOBILE-016
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Mode: VISUAL_PRODUCT (Targeted Mobile Polish Pilot)
- Target File: `src/components/landing/LandingPage.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Manager & Coordinator: Vallencia (default)
- Authority: Eka

---

## 1. OBJECTIVE
Perbaiki cacat responsivitas mobile (viewport 390x844) pada Hero Section di `src/components/landing/LandingPage.tsx`:
1. Eliminasi *horizontal overflow* yang menyebabkan judul, teks deskripsi, dan simulator Nara AI terpotong di tepi kanan layar ponsel.
2. Pastikan padding horizontal simetris (`padding-inline: 16px` atau `20px`) dan aman di layar sempit.
3. Buat tombol CTA utama "Mulai Belajar Sekarang — Gratis" menjadi full-width (`width: 100%`, `justify-content: center`, min-height 48px) khusus di mobile agar ramah jangkauan jempol (*thumb-zone friendly*).
4. Pastikan judul utama responsif (`clamp(1.75rem, 6.5vw, 2.35rem)`) tanpa teks terpotong fisik.

---

## 2. STRICT PILOT CONSTRAINTS
- **TIDAK ADA REFACTOR BESAR**: Dilarang merombak struktur komponen atau menyentuh berkas lain selain blok CSS media query mobile di `src/components/landing/LandingPage.tsx`.
- **PATCH TERARAH**: Target diff <35 baris CSS. DILARANG melakukan full rewrite berkas.
- **BUKTI SKILL NYATA**: MARAKA wajib memanggil `skill_view(name="creative:popular-web-designs", file_path="templates/apple.md")` atau `linear.app.md` untuk mengutip konvensi mobile breakpoint (<600px single column, thumb target >=44px) dan membuktikannya di diff.
- **BUKTI VISUAL NYATA**: Screenshot mobile 390x844 sebelum perbaikan sudah disimpan di `public/assets/landing/showcase/pilot_hero_mobile_before.png`. MARAKA wajib menangkap screenshot SESUDAH di viewport yang SAMA (`width=390, height=844, deviceScaleFactor=3, mobile=True`) dan menyimpannya di `public/assets/landing/showcase/pilot_hero_mobile_after.png`.
- **VERIFIKASI TEST**: Wajib menjalankan `npm run build` dan `npm test` (83/83 passing).

---

## 3. ACCEPTANCE CRITERIA
- [ ] Git status diperiksa sebelum mengedit (`git status -s`).
- [ ] Skill desain dibaca via `skill_view` dan diterapkan nyata.
- [ ] Tidak ada teks atau kartu yang terpotong secara horizontal di viewport 390px.
- [ ] Tombol CTA utama full-width di mobile.
- [ ] Screenshot AFTER tersimpan di `public/assets/landing/showcase/pilot_hero_mobile_after.png`.
- [ ] `npm run build` sukses dan 83 unit test lulus 100%.
- [ ] Output token efisien (<6.000 tokens).
- [ ] DILARANG melakukan `git push`.
