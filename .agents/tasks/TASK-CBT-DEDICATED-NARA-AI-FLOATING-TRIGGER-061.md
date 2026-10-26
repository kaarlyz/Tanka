# TASK-CBT-DEDICATED-NARA-AI-FLOATING-TRIGGER-061: Instant Contextual Nara AI Floating Trigger in CBT Runner & Bottom Nav Access

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/index.css`
  - `tests/cbtNaraTrigger.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Insight
Pengguna menyampaikan:
> *"dan kenapa navigasi dibawah itu, malah hilang ... soalnya jadinya mau manggil nara itu susah"*

### Analisis Ergonomi:
1. Ketika pengguna sedang mengerjakan soal ujian CBT di ponsel, pengguna sering mengalami kebuntuan konsep (*struggling on question*) dan butuh bimbingan tutor cerdas **Nara AI**.
2. Sebelumnya, tombol memanggil Nara AI hanya berada di tab navigasi bawah `MobileBottomNav` (yang sempat disembunyikan), atau tersembunyi jauh di bawah setelah soal dijawab pada mode drill.
3. Pengguna butuh akses **1-ketukan instan** (*1-tap instant invocation*) untuk memanggil Nara AI kapan saja dari layar ujian, lengkap dengan injeksi konteks soal yang sedang dibuka (*soal, wacana, opsi*) tanpa harus repot mengetik ulang pertanyaan.

---

## 2. Spesifikasi Implementasi

### A. Dedicated Nara AI Quick-Action Pill di Action Bar Bawah (`ExamCbtTab.tsx`)
1. Di bilah navigasi soal melayang (`.cbt-action-footer`), tambahkan tombol cepat **Tanya Nara**:
   ```tsx
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
     whileTap={{ scale: 0.94 }}
     transition={{ type: "spring", stiffness: 400, damping: 25 }}
     className="cbt-nara-quick-btn"
     style={{
       padding: "8px 12px",
       borderRadius: 8,
       backgroundColor: "#18221f",
       color: "#c8f064",
       border: "1px solid #18221f",
       fontWeight: 800,
       fontSize: 12,
       cursor: "pointer",
       display: "inline-flex",
       alignItems: "center",
       gap: 6,
       boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
       whiteSpace: "nowrap",
       touchAction: "manipulation"
     }}
     title="Tanya Nara AI seputar soal ini"
   >
     <Sparkles size={14} color="#c8f064" />
     <span>Tanya Nara</span>
   </motion.button>
   ```
2. Letakkan tombol ini di tengah antara tombol *"Sebelumnya"* dan *"Berikutnya"*, atau di header mobile kanan samping tombol *"Aa"* / *"Palette"*.
3. Dengan demikian, di mana pun pengguna berada (baik saat tab bawah terlihat atau saat fokus di lembar soal), Nara AI bisa dipanggil dalam **1 kali sentuh**.

### B. Akses Penuh Nara AI di `MobileBottomNav`
1. Pastikan tab tengah **"Nara AI"** di `MobileBottomNav` membuka panel laci drawer Nara AI secara instan (`z-index: 5000`) tanpa mereset atau menutup sesi ujian CBT yang sedang berjalan di background.
2. Saat panel Nara AI ditutup (klik tombol close `✕`), pengguna langsung kembali ke posisi soal ujian yang sama persis tanpa kehilangan status.

### C. Unit Test (`tests/cbtNaraTrigger.test.js`)
Buat test suite yang memverifikasi:
1. Tombol cepat "Tanya Nara" terpasang di interface CBT runner.
2. Mengklik tombol memanggil `onOpenNara` dengan context payload soal & paket aktif yang lengkap.
3. Tombol "Nara AI" di `MobileBottomNav` membuka panel AI tanpa menghancurkan state CBT runner.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (185+ passing).
2. `npm run build` -> build passing (0 error).
3. Screenshot mobile (390x844) membuktikan tombol Nara AI terpasang rapi dan panel Nara AI terbuka mulus di `.agents/evidence/TASK-061-mobile-cbt-nara-trigger.png`.
