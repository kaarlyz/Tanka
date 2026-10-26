# TASK-AI-DRILL-ECONOMY-SOCIOLOGY-DIVERSITY-087

## Context & Audit Findings
Eka dan Lead Orchestrator menemukan 3 cacat arsitektur kritis pada `server/services/aiDrillGenerator.js`:
1. **Kebocoran Tema Ekonomi & Sosiologi (`DIVERSE_THEME_POOLS`):**
   - Pool tema mandiri hanya ada untuk `cerpen`, `artikel`, `inggris`, dan `matematika`.
   - Mapel Ekonomi dan Sosiologi belum punya pool tema sendiri.
   - Saat single pola (`pola !== 'all'`), Ekonomi dan Sosiologi dipaksa memakai `sampledArtikel` (urban heat island, daun nimba, intrusi air laut). Soal elastisitas pasar atau stratifikasi sosial jadi ganjil karena stimulusnya menempel pada wacana biologi kelautan/lingkungan.
2. **Polusi Sastra pada Paket Lengkap (`pola === 'all'`):**
   - Di `server/services/aiDrillGenerator.js`, blok `else` diperlakukan secara naif sebagai Bahasa Indonesia murni.
   - Jika generate Ekonomi atau Sosiologi 25/20/10 butir dengan `pola === 'all'`, generator otomatis menyuntikkan unit Cerpen Sastra Tradisi & Keluarga (`sampledCerpen`), lengkap dengan soal analisis watak tokoh Layur/Bapak, pemicu konflik batin, dan resolusi moral. Ini salah kaprah untuk TKA Ekonomi & Sosiologi Pusmendik.
3. **Data Empiris Pusmendik TKA (Ground Truth di `tanka.sqlite`):**
   - Ekonomi (49 butir riil): Opsi E tertinggi (29.6%), PG Kompleks didominasi opsi A (76.5%). 6 Pola Baku: Opportunity Cost, Pasar Qd=Qs, Moneter, Fiskal, Badan Usaha/Akuntansi, Valas/Neraca Pembayaran.
   - Sosiologi (50 butir riil): Non-Etis (anti-moral), Teori Tokoh (Weber, Durkheim, Marx), Stratifikasi vs Diferensiasi, Konflik/Resolusi, Perubahan Sosial/Modernisasi, Metodologi Penelitian. Kunci memusat di C & D (51.5%), first-row bias 85.7%.

## Discrete Implementation Mandate for MARAKA (Under AURA's Architectural Supervision)
1. **Dedicated Theme Pools di `DIVERSE_THEME_POOLS`:**
   - Tambahkan `ekonomi`: 12 tema autentik TKA Pusmendik:
     * Kelangkaan komoditas beras & intervensi stabilisasi harga pasar
     * Keseimbangan pasar Qd=Qs, pergeseran kurva akibat kenaikan PPN 12%
     * Kebijakan moneter Bank Indonesia (BI-Rate, operasi pasar terbuka, SRBI)
     * Kebijakan fiskal APBN (belanja subsidi energi vs pembiayaan infrastruktur)
     * Koperasi simpan pinjam vs perseroan terbatas (pembagian SHU & tata kelola)
     * Fluktuasi kurs Rupiah/USD dan kinerja ekspor manufaktur tekstil vs impor bahan baku
     * Neraca transaksi berjalan & hilirisasi komoditas tambang nikel
     * Inflasi pangan bergejolak (volatile foods) dan indeks harga konsumen (IHK)
     * Tingkat pengangguran terbuka, upah minimum provinsi (UMP), dan produktivitas tenaga kerja
     * Rasio Gini, kurva Lorenz, dan pemerataan distribusi pendapatan nasional
     * Pasar modal ritel, obligasi negara (SBN), dan edukasi literasi keuangan
     * Lembaga Penjamin Simpanan (LPS) dan stabilitas sistem perbankan nasional
   - Tambahkan `sosiologi`: 12 tema autentik TKA Pusmendik:
     * Ciri non-etis sosiologi: studi sosiologis pemukiman bantaran rel tanpa vonis moral
     * Teori aksi sosial Max Weber: rasionalitas tujuan pedagang online shop live streaming
     * Fakta sosial memaksa Émile Durkheim: aturan adat awig-awig di desa adat Bali
     * Teori konflik kelas Karl Marx: relasi kuasa pekerja gig economy (driver ojol) vs platform digital
     * Diferensiasi horizontal (suku, ras, agama) vs stratifikasi vertikal kekayaan
     * Akomodasi konflik sengketa lahan: perbedaan mediasi sukarela vs arbitrase mengikat
     * Fenomena cultural lag: adopsi cepat teknologi kecerdasan buatan vs etika integritas akademik
     * Transformasi sosial gemeinschaft (paguyuban desa) menjadi gesellschaft (patembayan kota)
     * Dampak konsumerisme dan gaya hidup hedonis akibat media sosial terhadap kohesi sosial
     * Metodologi kuantitatif survei kuesioner vs kualitatif observasi partisipatoris
     * Mobilitas sosial antargenerasi melalui akses pendidikan tinggi (beasiswa KIP-K)
     * Globalisasi budaya pop dan ketahanan kearifan lokal seni pertunjukan tradisional

2. **Perbaiki Single-Pola Theme Selector (`pola !== 'all'`):**
   - Jika `subject === 'Ekonomi'`, WAJIB konsumsi `DIVERSE_THEME_POOLS.ekonomi` (acak via Fisher-Yates).
   - Jika `subject === 'Sosiologi'`, WAJIB konsumsi `DIVERSE_THEME_POOLS.sosiologi` (acak via Fisher-Yates).
   - Isolasi 100% dari `sampledArtikel` biologi kelautan dan `sampledCerpen`.

3. **Purge Polusi Sastra pada Multi-Pola (`pola === 'all'`):**
   - Di `server/services/aiDrillGenerator.js`, buat penanganan unit eksplisit untuk `subject === 'Ekonomi'` dan `subject === 'Sosiologi'`:
     * Target 25 butir Ekonomi: 5-6 unit bertema ekonomi murni tanpa sastra (Opportunity Cost, Pasar Qd=Qs, Moneter, Fiskal, Badan Usaha, Valas).
     * Target 25 butir Sosiologi: 5-6 unit bertema sosiologi murni tanpa sastra (Non-Etis, Teori Tokoh, Stratifikasi, Konflik, Perubahan Sosial, Metodologi).
     * Nol butir cerita fiksi/sastra untuk Ekonomi dan Sosiologi.
     * Header wacana disesuaikan rapi.

4. **Verifikasi & Quality Gate:**
   - Buat test suite baru `tests/economySociologyDrillDiversity.test.js`:
     * Uji generate Ekonomi (pola 'all' & single pola) -> pastikan 0 teks cerpen, 0 teks biologi kelautan, 100% domain ekonomi.
     * Uji generate Sosiologi (pola 'all' & single pola) -> pastikan 0 teks cerpen, 0 teks biologi kelautan, 100% domain sosiologi.
   - `npm test` wajib 100% passing.
   - `npm run build` sukses 0 error.
   - Restart service `systemctl --user restart tanka`.
