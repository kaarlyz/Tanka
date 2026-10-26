# TASK-ADD-NARA-QUICK-BUTTON-CBT-DOCK-061: Add Contextual Tanya Nara Quick Button to CBT Action Dock

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `tests/cbtNaraTrigger.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement
Saat pengguna sedang mengerjakan soal ujian CBT di mobile:
1. Pengguna kesulitan memanggil Nara AI saat menghadapi soal sulit.
2. Bilah navigasi soal melayang di bawah (`.cbt-action-footer`) hanya memuat tombol "Sebelumnya", "Ragu-Ragu", dan "Berikutnya".
3. Pengguna membutuhkan tombol cepat **"Tanya Nara"** langsung di dalam bilah aksi soal tersebut yang otomatis menginjeksi konteks nomor soal, wacana, dan pertanyaannya ke chat Nara AI dalam 1 sentuhan.

---

## 2. Spesifikasi Implementasi

### A. Tambahkan Tombol "Tanya Nara" di `.cbt-action-footer` (`ExamCbtTab.tsx`)
Di dalam `footer.cbt-action-footer`, tempatkan tombol cepat di samping tombol Sebelumnya/Ragu-ragu:
```tsx
{/* Quick Action: Tanya Nara AI */}
<motion.button
  type="button"
  onClick={() => {
    if (!onOpenNara) return;
    const cleanBacaan = currentItem.bacaan
      ? currentItem.bacaan.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
      : "";
    const cleanSoal = currentItem.soal.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const query = `Halo Nara AI, saya sedang mengerjakan soal ujian ini dan butuh bantuan pemahaman konsep:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${currentItem.nomor}
${cleanBacaan ? `Wacana: "${cleanBacaan}..."\n` : ""}Pertanyaan: "${cleanSoal}"

Tolong berikan petunjuk/clue pemikiran tanpa langsung membocorkan jawaban final.`;
    onOpenNara(query);
  }}
  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
  className="cbt-nara-quick-btn"
  style={{
    padding: "8px 12px",
    borderRadius: 8,
    backgroundColor: "#18221f",
    color: "#c8f064",
    border: "1px solid #18221f",
    fontWeight: 800,
    fontSize: 12.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    flex: "1 1 auto",
    justifyContent: "center",
    maxWidth: 160,
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    touchAction: "manipulation",
  }}
  title="Tanya Nara AI seputar soal ini"
>
  <Sparkles size={14} color="#c8f064" />
  <span>Tanya Nara</span>
</motion.button>
```

### B. Unit Test (`tests/cbtNaraTrigger.test.js`)
Buat test suite yang memverifikasi:
1. Tombol `cbt-nara-quick-btn` dirender di dalam footer aksi CBT runner.
2. Mengklik tombol memanggil `onOpenNara` dengan teks query yang memuat nomor soal dan materi aktif.

---

## 3. Verification Protocol
1. `npm test` passing (185+ passing).
2. `npm run build` passing.
