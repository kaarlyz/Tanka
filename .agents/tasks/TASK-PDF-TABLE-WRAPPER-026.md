# TASK: TASK-PDF-TABLE-WRAPPER-026
## MODE: HYBRID
## SURFACE ARCHETYPE: Print Table Overflow & Margin Protection

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/tabs/MaterialTab.tsx`
  - `src/index.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pada audit visual `perfect_page-02.png`:
Tabel di bagian bawah Page 2 tertimpa oleh footer metadata karena tabel dibungkus di dalam `<div style={{ overflowX: "auto" }}>`.
Di mesin cetak Chromium, properti `overflow-x: auto` menciptakan Scroll Container BFC (Block Formatting Context) yang menonaktifkan aturan `break-inside: avoid` bawaan pada `<table>`. Akibatnya kontainer tabel meluap menembus batas bawah halaman dan menabrak garis footer.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Perbarui `src/components/tabs/MaterialTab.tsx`
Pada `markdownComponents.table`:
Tambahkan kelas `.table-scroll-wrapper` dan buat overflow responsif hanya di layar non-print:
```tsx
    table: ({ children }: any) => (
      <div className="table-scroll-wrapper" style={{ margin: "14px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, border: "1px solid #dde1da", borderRadius: 8 }}>
          {children}
        </table>
      </div>
    )
```

### B. Perbarui `src/index.css`
1. Di luar print:
```css
.table-scroll-wrapper {
  overflow-x: auto;
  max-width: 100%;
}
```
2. Di dalam blok `@media print`:
```css
     @page {
       size: A4 portrait;
       margin-top: 16mm;
       margin-left: 16mm;
       margin-right: 16mm;
       margin-bottom: 28mm;
     }

     .table-scroll-wrapper {
       overflow: visible !important;
       break-inside: avoid !important;
       page-break-inside: avoid !important;
       margin: 12pt 0 !important;
     }

     .markdown-body table,
     .nara-md-response table {
       width: 100% !important;
       border-collapse: collapse !important;
       break-inside: avoid !important;
       page-break-inside: avoid !important;
       font-size: 9pt !important;
     }

     body::after {
       content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
       position: fixed;
       bottom: 4mm;
       left: 16mm;
       right: 16mm;
       font-size: 7.5pt;
       font-weight: 700;
       color: #8c9892 !important;
       font-family: 'DM Mono', monospace !important;
       letter-spacing: 0.6px;
       border-top: 1px solid #dce2d8 !important;
       padding-top: 2.5mm;
       text-align: right;
       z-index: 9999;
       pointer-events: none !important;
       background: transparent !important;
     }
```

---

## 3. ACCEPTANCE CRITERIA
- [x] Kontainer pembungkus tabel memiliki kelas `.table-scroll-wrapper`.
- [x] Di `@media print`, `.table-scroll-wrapper` memiliki `overflow: visible !important; break-inside: avoid !important;`.
- [x] Tabel di Page 2 tidak lagi menembus margin bawah; jika tidak muat di sisa halaman, tabel berpindah otomatis ke halaman berikutnya (`break-inside: avoid`).
- [x] Footer watermark di seluruh halaman terbebas 100% dari tabrakan teks atau tabel.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
