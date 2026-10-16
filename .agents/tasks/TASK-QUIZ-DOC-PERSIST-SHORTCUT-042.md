# TASK-QUIZ-DOC-PERSIST-SHORTCUT-042: Active Material LocalStorage Persistence & Quiz Tab Quick Switcher Shortcut

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/hooks/useDocuments.ts`
  - `src/App.tsx`
  - `src/components/tabs/QuizTab.tsx`
  - `src/index.css`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Latar Belakang Masalah
Pengguna memberikan masukan UX terkait navigasi dan persistensi materi di tab Latihan Soal (`/quiz`):
> *"btw pas misal di menu latsol itu kek pas di refresh malah keluar dri materi, nah maunya disitu kek ad pilihan mau ke materi yg mana (shortcut) km paham kan biar ui ux ny nyaman"*

### Akar Masalah:
1. **Ketiadaan Persistensi Dokumen Aktif pada Refresh Browser**:
   State `activeDocId` di `useDocuments.ts` hanya disimpan di memori React (`useState(null)`). Saat browser di-refresh, `activeDocId` ter-reset ke `null`. Akibatnya materi yang sedang dipelajari terlepas, dan kuis terkunci dalam status `disabled` karena tidak ada materi yang aktif.
2. **Ketiadaan Shortcut / Pemilih Materi di Tab Latihan Soal**:
   Komponen `QuizTab.tsx` tidak menerima prop `documents` maupun `loadDocument`. Pengguna yang ingin berganti materi atau yang belum memilih materi terpaksa harus keluar dari tab Latihan Soal, kembali ke Beranda Hub atau tab Materi Saya, mencari kartu modul, dan mengkliknya kembali.

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Persistensi Dokumen Aktif di `src/hooks/useDocuments.ts`
1. Gunakan konstanta `ACTIVE_DOC_STORAGE_KEY = "tanka_active_doc_id"`.
2. Di dalam fungsi `loadDocument`:
   Simpan ID materi ke localStorage:
   ```typescript
   if (typeof window !== "undefined") {
     localStorage.setItem(ACTIVE_DOC_STORAGE_KEY, targetId);
   }
   ```
3. Di dalam fungsi `handleDeleteDocument`:
   Jika dokumen yang dihapus adalah dokumen aktif, hapus dari localStorage:
   ```typescript
   if (typeof window !== "undefined") {
     localStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
   }
   ```
4. Di dalam fungsi `fetchDocuments`:
   Saat dokumen berhasil diambil dari API `/api/documents`, pulihkan otomatis dokumen aktif:
   ```typescript
   const urlParams = new URLSearchParams(window.location.search);
   const urlDocId = urlParams.get("id");
   const savedDocId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_DOC_STORAGE_KEY) : null;

   const docToLoad = (urlDocId && data.documents.some((d: any) => d.id === urlDocId))
     ? urlDocId
     : (savedDocId && data.documents.some((d: any) => d.id === savedDocId))
       ? savedDocId
       : null;

   if (docToLoad) {
     loadDocument(docToLoad);
   }
   ```

### B. Hubungkan Prop ke `QuizTab` di `src/App.tsx`
Teruskan prop `documents` dan `loadDocument` ke komponen `<QuizTab>`:
```tsx
<QuizTab
  ...
  documents={documents}
  loadDocument={loadDocument}
  ...
/>
```

### C. Tambahkan Material Quick Switcher Shortcut di `src/components/tabs/QuizTab.tsx`
1. Perbarui interface `QuizTabProps`:
   ```typescript
   documents?: DocumentItem[] | any[];
   loadDocument?: (docOrId: any) => void;
   ```
2. **Shortcut pada Bilah Atas Kuis (Saat Soal Sudah Terbit / `quizQuestions.length > 0`)**:
   Tambahkan dropdown pemilih materi cepat di sebelah kiri bilah kontrol soal:
   - Menampilkan ikon dokumen / buku (`BookOpen`).
   - Dropdown `<select>` dengan daftar materi yang tersimpan (`documents`).
   - Nilai default terikat ke `activeDocId`.
   - Event `onChange` langsung memicu `loadDocument(selectedDoc)`.
   - Desain minimalis elegan: border hairline `#dce1da`, font Manrope 12px, tinggi pas dengan kontrol jumlah soal.
3. **Shortcut pada Layar Konfigurasi Kuis Kosong (Sebelum Soal Terbit / `quizQuestions.length === 0`)**:
   Di dalam kartu konfigurasi *"Simulasi Latihan Soal Pemahaman"*:
   - Tambahkan blok **"Materi Pembelajaran Aktif (Shortcut):"** sebelum pemilihan jumlah soal.
   - Jika ada materi tersimpan: tampilkan dropdown pilihan modul atau selector berdesain bersih yang menunjukkan judul modul saat ini, serta memungkinkan pengguna berpindah materi dalam 1 klik tanpa harus keluar dari tab Latihan Soal.
   - Jika belum ada materi sama sekali (`documents.length === 0`): tampilkan tombol shortcut aksi *"Buat Materi Baru"* atau *"Unggah Dokumen"*.

### D. CSS Styling di `src/index.css`
Pastikan dropdown pemilih materi di mobile dan desktop memiliki padding responsif, teks tidak terpotong (ellipsis), dan `appearance: none` rapi dengan chevron.

---

## 3. Acceptance Criteria
- [ ] Me-refresh browser di halaman kuis (`/quiz`) mempertahankan materi yang sedang aktif (tidak keluar dari materi).
- [ ] Di dalam tab Latihan Soal terdapat dropdown/shortcut pemilih materi yang langsung memuat materi terpilih tanpa harus membuka Beranda Hub.
- [ ] Tombol "Susun Soal Sekarang" tidak lagi terkunci jika materi tersimpan otomatis terhubung.
- [ ] Responsif di mobile (390px) dan desktop (1920px), nol overflow horizontal.
- [ ] Test suite `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [ ] `npm run build` sukses.
- [ ] Layanan `systemctl --user restart tanka` aktif.
- [ ] DILARANG melakukan `git push` ke GitHub remote.
