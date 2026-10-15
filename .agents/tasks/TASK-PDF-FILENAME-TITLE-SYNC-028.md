# TASK: TASK-PDF-FILENAME-TITLE-SYNC-028
## MODE: HYBRID
## SURFACE ARCHETYPE: Document Title & PDF Export Naming Synchronization

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/App.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `src/components/tabs/SummaryTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna bertanya:
> *"eh pas di save itu pdf otomatis pake nama judulnya gitu ya"*

Saat ini di browser, saat pengguna mengklik tombol "PDF" (`window.print()`), browser Chromium/Safari/Firefox mengambil saran nama file PDF bawaan dari nilai `document.title`.
Karena `document.title` masih terkunci ke nilai statis di `index.html` (`🐴 Tanka - AI Autonomous Study Platform`), nama file PDF yang disarankan browser saat disimpan masih berupa nama statis aplikasi, bukan judul materi yang sedang dibuka.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Sinkronisasi Dinamis `document.title` di `src/App.tsx`
Tambahkan hook `useEffect` di `src/App.tsx`:
```tsx
  // Sinkronisasi document.title untuk tab browser dan default filename PDF export
  useEffect(() => {
    if (activeDocTitle && activeTab !== "landing") {
      const sanitized = activeDocTitle.replace(/[\\/:*?"<>|]/g, " ").trim();
      document.title = `${sanitized} · Tanka`;
    } else if (activeTab === "landing") {
      document.title = "Tanka - AI Autonomous Study Platform";
    } else {
      document.title = "Tanka";
    }
  }, [activeDocTitle, activeTab]);
```

### B. Handler Cetak Aman di `src/components/tabs/MaterialTab.tsx`
Buat fungsi `handlePrint` khusus sebelum `window.print()`:
```tsx
  const handlePrint = () => {
    const cleanTitle = (activeDocTitle || "Modul Belajar").replace(/[\\/:*?"<>|]/g, " ").trim();
    document.title = `${cleanTitle} · Tanka`;
    window.print();
  };
```
Gunakan `onClick={handlePrint}` pada tombol PDF (baris ~906).

### C. Handler Cetak Aman di `src/components/tabs/SummaryTab.tsx`
Gunakan pola serupa pada tombol PDF di `SummaryTab.tsx` (baris ~233):
```tsx
  const handlePrint = () => {
    const cleanTitle = (activeDocTitle || "Rangkuman Belajar").replace(/[\\/:*?"<>|]/g, " ").trim();
    document.title = `Rangkuman ${cleanTitle} · Tanka`;
    window.print();
  };
```

---

## 3. ACCEPTANCE CRITERIA
- [x] Tab browser otomatis menampilkan judul materi yang sedang dibuka (`[Judul Materi] · Tanka`).
- [x] Tombol PDF menetapkan `document.title` bersih (bebas karakter ilegal file system `\/:*?"<>|`).
- [x] Dialog simpan PDF otomatis menyarankan nama file sesuai judul materi.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 4. VERIFICATION EVIDENCE
- **Dynamic Title Synchronization (`src/App.tsx`)**:
  - `useEffect` ditambahkan untuk memutakhirkan `document.title` saat `activeDocTitle` atau `activeTab` berubah.
  - Verifikasi browser: Membuka materi *"Matematika Fundamental: Mengenal Himpunan Bilangan"* mengubah `document.title` menjadi `Matematika Fundamental Mengenal Himpunan Bilangan · Tanka`.
- **Material Tab PDF Handler (`src/components/tabs/MaterialTab.tsx`)**:
  - `handlePrint` membersihkan karakter ilegal dan menetapkan `${cleanTitle} · Tanka` sebelum `window.print()`.
  - Verifikasi browser: Trigger tombol PDF menghasilkan `titleAtPrint: "Matematika Fundamental Mengenal Himpunan Bilangan · Tanka"`.
- **Summary Tab PDF Handler (`src/components/tabs/SummaryTab.tsx`)**:
  - `handlePrint` membersihkan karakter ilegal dan menetapkan `Rangkuman ${cleanTitle} · Tanka` sebelum `window.print()`.
  - Verifikasi browser: Trigger tombol Cetak PDF menghasilkan `titleAtPrint: "Rangkuman Matematika Fundamental Mengenal Himpunan Bilangan · Tanka"`.
- **Build & Tests**:
  - `npm run build`: sukses (413ms, tanpa error).
  - `env TANKA_DB_PATH=:memory: node --test tests/*.test.js`: 83/83 tests PASS.
