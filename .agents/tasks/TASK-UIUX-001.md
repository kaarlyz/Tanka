# TASK: TASK-UIUX-001
## STATUS
ACCEPTED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Baseline Commit: 1de9773e40e7c144c7f7a9aa8147511ab4f973c2
- Assigned: MARAKA (maraka)
- Reviewer: AURA (gikano)
- Authority: Eka

## OBJECTIVE
Sederhanakan dan bersihkan UI/UX Tanka: eliminasi duplikasi komponen (chat ganda, sidebar modul ganda), optimasi kerapian TopBar mobile, perbaiki visual scrollbar mobile, dan standarisasikan label aksi.

## SCOPE & CHANGES IMPLEMENTED
1. Eliminasi Chat Ganda:
   - Rute `chat` dihapus dari `src/hooks/useAppRoute.ts` dan `src/types/index.ts`.
   - Import dan blok render `ChatTab` dihapus dari `src/App.tsx`.
   - `Tanya Nara` universal melalui slide-over drawer `TanyaNaraPanel`.
2. Pembersihan Sidebar Desktop (`src/components/layout/Sidebar.tsx`):
   - Blok `MATERI TERSIMPAN`, mini search `Cari modul...`, tombol `+ Baru`, dan tombol ganda `Hapus Semua` dihapus dari sidebar kiri.
   - Manajemen modul dipusatkan penuh di kanvas utama (HomeHub & MaterialTab).
3. Optimasi TopBar Mobile (`src/components/layout/TopBar.tsx`):
   - Micro play/pause dan micro sliders dipindahkan ke `className="desktop-only"`.
   - Di mobile, timer tampil sebagai pill digital bersih (`[ Clock  10:00 ]`) yang membuka setelan/kontrol nyaman saat disentuh.
4. CSS Reset Scrollbar Mobile (`index.html`):
   - Ditambahkan `@media (max-width: 768px)` global scrollbar suppression untuk touch screens (`scrollbar-width: none; ::-webkit-scrollbar { display: none !important; }`).
5. Standarisasi Label Aksi (`src/components/tabs/HomeHubTab.tsx`):
   - Diselaraskan menjadi `Baca Materi` dan `Latihan Soal` di seluruh card.

## VERIFICATION EVIDENCE
- `npm run build`: PASS (356ms, bundle 1,331.92 kB, berkurang 14 kB).
- `npm test`: PASS (72/72 tests, 0 fail, 22.2s).
- Visual Screenshot Desktop & Mobile: VERIFIED bersih via Vision Inspection.
- Service restart: `systemctl --user restart tanka` aktif.
