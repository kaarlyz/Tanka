# TASK-BACKGROUND-PERSIST-PWA-NOTIFICATIONS-048: Background Pipeline Persistence & Web Push Notifications

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/utils/notification.ts`
  - `src/hooks/useDocuments.ts`
  - `src/hooks/useUploadStaging.ts`
  - `src/App.tsx`
  - `public/sw.js`
  - `tests/notificationPersistence.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause

### Masalah 1: Status Pemrosesan Hilang Saat Pindah Aplikasi di Ponsel
1. **Penyebab:**
   - Polling latar belakang (`useUploadStaging.ts` dan `useDocuments.ts`) hanya hidup di memori React komponen aktif melalui `setInterval`.
   - Di mobile browser (Chrome/Safari), saat pengguna berpindah aplikasi atau mengunci layar (`visibilityState === 'hidden'`), sistem operasi membekukan (*freeze*) thread JavaScript atau menghentikan timer.
   - Lebih buruk lagi, jika tab ter-reload saat dibuka kembali, state dokumen pending hilang dan aplikasi kembali ke layar awal tanpa melanjutkan pemantauan.
2. **Solusi:**
   - Simpan ID dokumen yang sedang diproses ke `localStorage` (misal `tanka_pending_jobs: string[]` atau `tanka_active_processing_doc`).
   - Tambahkan listener `visibilitychange` dan `window.addEventListener('focus')`: begitu tab aktif kembali, periksa status dokumen langsung (`GET /api/documents/:id`) dan sinkronkan state seketika.
   - Pada inisialisasi aplikasi (`App.tsx` / `useDocuments.ts`), cek apakah ada dokumen pending di `localStorage`. Jika ada, resume polling otomatis sampai tuntas.

### Masalah 2: Ketiadaan Notifikasi Sistem Saat Proses Selesai di Latar Belakang
1. **Penyebab:**
   - Platform saat ini hanya mengandalkan toast UI (`showNotice`) di dalam DOM layar aktif. Jika pengguna membuka aplikasi lain (WhatsApp, YouTube, dll.), mereka tidak tahu kapan 30 soal ujian atau bab modul selesai disusun (5-10 menit kemudian).
2. **Solusi:**
   - Buat helper `src/utils/notification.ts` yang menangani Web Notification API & Service Worker `showNotification`.
   - Minta izin notifikasi browser secara elegan (`Notification.requestPermission()`) saat pertama kali memulai unggahan atau saat trigger tombol.
   - Begitu dokumen selesai diproses (`status === 'completed'`), jika dokumen ada di background atau halaman sedang `document.hidden`, tembak Web Push/System Notification via `ServiceWorkerRegistration.showNotification()` atau `new Notification()`:
     - Judul: `Tanka: Materi Siap Dipelajari!`
     - Body: `"${doc.title}" selesai diproses (${doc.question_count || 0} butir soal siap dibedah).`
     - Icon: `/icon-192.png`
     - Click action: fokus tab dan buka dokumen terkait.

---

## 2. Spesifikasi Implementasi

### A. Buat `src/utils/notification.ts`
1. `requestNotificationPermission(): Promise<boolean>`
2. `sendSystemNotification(title: string, options: { body: string; icon?: string; tag?: string; data?: any }): Promise<void>`
   - Dukung Service Worker registration (`navigator.serviceWorker.ready`) sebagai prioritas utama (agar bekerja di Android Chrome PWA saat tab di background).
   - Fallback ke `new Notification()` bila SW belum siap.

### B. Perbarui `public/sw.js`
1. Tambahkan event listener `notificationclick`:
   ```javascript
   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     event.waitUntil(
       clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
         for (const client of clientList) {
           if (client.url && 'focus' in client) {
             return client.focus();
           }
         }
         if (clients.openWindow) {
           return clients.openWindow('/');
         }
       })
     );
   });
   ```
2. Update cache version ke `tanka-pwa-v7`.

### C. Hardening `src/hooks/useDocuments.ts` & `src/hooks/useUploadStaging.ts`
1. Simpan `data.id` ke `localStorage.setItem('tanka_processing_docs', ...)` saat status `processing`.
2. Di `useDocuments.ts`:
   - Di `fetchDocuments` atau `useEffect` mount: jika ada dokumen dengan status `processing` di daftar dokumen atau `localStorage`, nyalakan background poller yang tangguh.
   - Tambahkan event `visibilitychange`: saat `document.visibilityState === 'visible'`, langsung trigger `fetchDocuments()` dan cek status dokumen aktif seketika tanpa nunggu jeda timer.
   - Saat status berubah dari `processing` $\to$ `completed`:
     - Hapus dari `tanka_processing_docs`.
     - Tembak notifikasi sistem via `sendSystemNotification()`.
     - Bunyikan audio / tampilkan toast konfirmasi.

---

## 3. Verification Protocol
1. Buat unit tests di `tests/notificationPersistence.test.js` untuk memverifikasi helper dan logika sinkronisasi pending jobs.
2. `npm test` -> 100% passing.
3. `npm run build` -> sukses.

---

## 4. Execution & Verification Report
- Status: `VERIFIED`
- Executor: MARAKA
- Files Created/Modified:
  - `src/utils/notification.ts` (created: Web Notification API, Service Worker registration.showNotification(), deduplication, storage helpers `tanka_processing_docs`)
  - `public/sw.js` (updated: cache v7, `notificationclick` handler focus/openWindow)
  - `src/hooks/useDocuments.ts` (updated: `tanka_processing_docs` sync, `visibilitychange` & `focus` listeners, background poller, notification triggers)
  - `src/hooks/useUploadStaging.ts` (updated: permission request on staging upload, `tanka_processing_docs` tracking, completion notification)
  - `tests/notificationPersistence.test.js` (5 unit tests covering storage, permission, SW prioritization, fallback, notification format & deduplication, sw.js cache & click listener)
- Verification Results:
  - `tests/notificationPersistence.test.js`: 5/5 passing
  - `npm test`: 126/126 passing (0 failures)
  - `npm run build`: built clean in ~420ms without warnings/errors

---

## 5. Independent Audit Report (AURA)
- Date: 2026-10-24
- Auditor: AURA (`gikano`)
- Verdict: `ACCEPTED`
- Scope Verification:
  1. `src/utils/notification.ts`: Service Worker `registration.showNotification` diprioritaskan di atas `new Notification()`. Permission check rapi (`granted` / `denied` short-circuit). Anti-spam terproteksi via memory `Set` dan native OS notification tag.
  2. `public/sw.js`: Cache bump `tanka-pwa-v7` terverifikasi. Handler `notificationclick` menutup notifikasi, memfokuskan tab klien aktif / navigasi URL target, dan fallback ke `clients.openWindow`.
  3. `useDocuments.ts` & `useUploadStaging.ts`: Tracking pending jobs via `localStorage` (`tanka_processing_docs`). Listener `visibilitychange` dan `focus` sukses men-trigger re-hydration instan saat tab dibuka kembali di mobile.
  4. Independent test suite: 126/126 passing, build sukses tanpa issue.
- Telegram notification: Terkirim ke Eka.
