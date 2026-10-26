const ai = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");

const SUBJECT_BLUEPRINTS = {
  "Bahasa Indonesia": {
    1: { id: "1", nama: "Pola 1 — Makna Kosakata & Istilah Serapan", deskripsi: "Substitusi kata, serapan asing/daerah, makna kontekstual", tipe_soal: "pilihan_ganda" },
    2: { id: "2", nama: "Pola 2 — Gagasan Utama & Kalimat Penutup", deskripsi: "Kalimat payung deduktif/induktif atau simpulan akhir wacana", tipe_soal: "pilihan_ganda" },
    3: { id: "3", nama: "Pola 3 — Fakta Wacana & Kausalitas Paragraf", deskripsi: "Penyebab-akibat eksplisit, 'mengapa X...', pola pengembangan", tipe_soal: "pilihan_ganda" },
    4: { id: "4", nama: "Pola 4 — Tujuan & Sikap Penulis", deskripsi: "Maksud penggunaan kalimat, nada emosional, keberpihakan", tipe_soal: "pilihan_ganda" },
    5: { id: "5", nama: "Pola 5 — Pernyataan Benar/Salah (Tabel Grid & Checkbox)", deskripsi: "Evaluasi multi-baris data wacana", tipe_soal: "pernyataan" },
    6: { id: "6", nama: "Pola 6 — Teks Sastra / Cerpen (Karakter & Konflik)", deskripsi: "Watak tokoh dari aksi/dialog, pemicu konflik, nilai moral", tipe_soal: "pilihan_ganda" },
    7: { id: "7", nama: "Pola 7 — Prediksi Skenario What-If Sastra", deskripsi: "Dampak jika tindakan/keputusan tokoh diubah, konsekuensi hipotetis alur cerita", tipe_soal: "pilihan_ganda" },
    8: { id: "8", nama: "Pola 8 — Urutan Kronologis & Rekonstruksi Akhir Cerita", deskripsi: "Menyusun sekuens urutan kejadian atau memilih paragraf penutup cerita yang selaras dengan resolusi", tipe_soal: "pilihan_ganda" },
    9: { id: "9", nama: "Pola 9 — Relevansi Nilai Sosial & Moral ke Realitas", deskripsi: "Korelasi nilai sosial, kritik, sindiran, atau amanat cerita dengan fenomena masyarakat modern", tipe_soal: "pilihan_ganda" },
    10: { id: "10", nama: "Pola 10 — Komparasi Dua Teks (Dual-Passage)", deskripsi: "Membandingkan dua teks tentang topik sama dari sudut pandang atau fokus berbeda", tipe_soal: "pilihan_ganda" },
    11: { id: "11", nama: "Pola 11 — Evaluasi Dialog Tanggapan Pembaca", deskripsi: "Menilai validitas reaksi atau argumen pihak ketiga terhadap isi teks (Setuju/Tidak)", tipe_soal: "pernyataan" }
  },
  "Bahasa Inggris": {
    1: { id: "1", nama: "Pola 1 — Main Idea & Primary Purpose", deskripsi: "Topic sentence, thesis statement, overall purpose of the passage", tipe_soal: "pilihan_ganda" },
    2: { id: "2", nama: "Pola 2 — Stated Detail & Scanning Fact", deskripsi: "Explicit facts mentioned directly in the text", tipe_soal: "pilihan_ganda" },
    3: { id: "3", nama: "Pola 3 — Unstated / Negative Detail ('Which is NOT true...')", deskripsi: "Identifying false statements or exceptions according to the passage", tipe_soal: "pilihan_ganda" },
    4: { id: "4", nama: "Pola 4 — Inference & Implicit Meaning", deskripsi: "Drawing logical conclusions not stated explicitly ('It can be inferred...')", tipe_soal: "pilihan_ganda" },
    5: { id: "5", nama: "Pola 5 — Vocabulary in Context & Synonym", deskripsi: "Contextual meaning of academic words in sentences", tipe_soal: "pilihan_ganda" },
    6: { id: "6", nama: "Pola 6 — Author's Tone, Attitude & Text Structure", deskripsi: "Evaluating author's stance (skeptical, optimistic) & paragraph organization", tipe_soal: "pilihan_ganda" }
  },
  "Matematika": {
    1: { id: "1", nama: "Pola 1 — Transformasi Geometri Kurva", deskripsi: "Translasi, refleksi garis x=k / y=-x, rotasi pusat (a,b), dan dilatasi", tipe_soal: "pilihan_ganda" },
    2: { id: "2", nama: "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat", deskripsi: "Eliminasi penyebut, diskriminan, faktorisasi sebelum coret", tipe_soal: "pilihan_ganda" },
    3: { id: "3", nama: "Pola 3 — SPLDV & Pemodelan Matriks Terapan", deskripsi: "Invers matriks, determinan, pemodelan sistem linear terapan", tipe_soal: "pilihan_ganda" },
    4: { id: "4", nama: "Pola 4 — Barisan & Deret Aritmetika/Geometri", deskripsi: "Suku ke-n, jumlah deret, aplikasi bunga majemuk dan pertumbuhan", tipe_soal: "pilihan_ganda" },
    5: { id: "5", nama: "Pola 5 — Trigonometri & Dimensi Tiga Dasar", deskripsi: "Aturan sinus/cosinus, jarak titik ke garis/bidang terapan", tipe_soal: "pilihan_ganda" },
    6: { id: "6", nama: "Pola 6 — Statistika & Peluang Terapan (Kombinatorika/Himpunan)", deskripsi: "Kaidah pencacahan, permutasi, kombinasi, rata-rata gabungan terapan", tipe_soal: "pilihan_ganda" }
  },
  "Ekonomi": {
    1: { id: "1", nama: "Pola 1 — Kelangkaan & Biaya Peluang (Opportunity Cost)", deskripsi: "Pengorbanan terbaik dari alternatif yang ditinggalkan", tipe_soal: "pilihan_ganda" },
    2: { id: "2", nama: "Pola 2 — Mekanisme Pasar & Keseimbangan (Qd = Qs)", deskripsi: "Titik ekuilibrium, pergeseran kurva, elastisitas harga", tipe_soal: "pilihan_ganda" },
    3: { id: "3", nama: "Pola 3 — Inflasi, Indeks Harga & Kebijakan Moneter", deskripsi: "Operasi pasar terbuka, diskonto, giro wajib minimum bank sentral", tipe_soal: "pilihan_ganda" },
    4: { id: "4", nama: "Pola 4 — Kebijakan Fiskal, APBN/APBD & Pajak", deskripsi: "Instrumen belanja negara dan perpajakan terhadap daya beli", tipe_soal: "pilihan_ganda" },
    5: { id: "5", nama: "Pola 5 — Badan Usaha (BUMN, BUMS, Koperasi) & Akuntansi", deskripsi: "Karakteristik badan usaha, jurnal umum dan persamaan dasar", tipe_soal: "pernyataan" },
    6: { id: "6", nama: "Pola 6 — Perdagangan Internasional & Neraca Pembayaran", deskripsi: "Keunggulan komparatif, kurs valuta asing, tarif dan kuota impor", tipe_soal: "pilihan_ganda" }
  },
  "Sosiologi": {
    1: { id: "1", nama: "Pola 1 — Konsep Sosiologi & Ciri Non-Etis", deskripsi: "Sosiologi sebagai ilmu empiris, kumulatif, teoretis, dan non-etis", tipe_soal: "pilihan_ganda" },
    2: { id: "2", nama: "Pola 2 — Interaksi Sosial & Teori Tokoh (Weber, Durkheim, Marx)", deskripsi: "Tindakan sosial, fakta sosial yang memaksa, dan konflik kelas", tipe_soal: "pilihan_ganda" },
    3: { id: "3", nama: "Pola 3 — Stratifikasi & Diferensiasi Sosial Multikultural", deskripsi: "Pelapisan sosial terbuka/tertutup, kemajemukan suku/agama", tipe_soal: "pilihan_ganda" },
    4: { id: "4", nama: "Pola 4 — Konflik Sosial & Resolusi Integrasi", deskripsi: "Pemicu konflik horizontal/vertikal, mediasi, arbitrase, konsiliasi", tipe_soal: "pilihan_ganda" },
    5: { id: "5", nama: "Pola 5 — Perubahan Sosial & Dampak Globalisasi", deskripsi: "Modernisasi, konsumerisme, kesenjangan kultural (cultural lag)", tipe_soal: "pernyataan" },
    6: { id: "6", nama: "Pola 6 — Metodologi Penelitian Sosial", deskripsi: "Kuantitatif survei vs kualitatif wawancara mendalam, triangulasi data", tipe_soal: "pilihan_ganda" }
  }
};

const DIVERSE_THEME_POOLS = {
  cerpen: [
    "Montir bengkel las bubut di pinggiran kota menghadapi pesanan mesin modern",
    "Penenun songket tradisional di Palembang dan tawaran benang sintetis impor",
    "Penjaga sinyal dan wesel stasiun kereta perintis menjelang otomatisasi rel ganda",
    "Pengrajin gerabah tanah liat Kasongan berdialog dengan anaknya tentang pasar keramik",
    "Petani kopi lereng Gunung Ijen menghadapi anomali cuaca mikro dan sistem tebas tengkulak",
    "Pande besi perkakas tani di pasar pedalaman yang menjaga resep sepuhan baja arang",
    "Pedagang buku bekas legendaris di emperan Kwitang menyikapi kepunahan toko fisik",
    "Juru mudi kapal kayu perintis antarpulau di Maluku menyikapi pembangunan dermaga ferry",
    "Pengukir kayu jati Jepara dan dilema pesanan mebel partikel minimalis cepat saji",
    "Guru sekolah perintis tapal batas yang menyusun perpustakaan keliling perahu",
    "Pengrajin batik cap pesisir Pekalongan dan limbah pewarna alami daun mangga",
    "Pembalak liar insaf yang kini menjadi pemandu ekowisata hutan mangrove Kutai"
  ],
  artikel: [
    "Fenomena pulau panas perkotaan (urban heat island) dan kanopi vegetasi tropis",
    "Krisis intrusi air asin pada akuifer pesisir akibat overekstraksi air tanah perkotaan",
    "Bioakumulasi mikroplastik pada garam tambak tradisional dan filtrasi bertingkat",
    "Revitalisasi tata kelola irigasi subak di tengah tekanan alih fungsi lahan sawah",
    "Bioinsektisida nabati berbahan ekstrak daun nimba untuk pengendalian hama wereng",
    "Dilema logistik rantai dingin (cold chain) perikanan tangkap di kepulauan terluar",
    "Laju amblesan tanah aluvial di kawasan pesisir industri utara Jawa",
    "Kearifan adat sasi laut di Maluku Tengah sebagai instrumen konservasi terumbu",
    "Dinamika restorasi hidrologis kubah gambut tropis pasca-degradasi kanal",
    "Aplikasi komposit laminasi bambu petung untuk struktur bangunan tahan gempa",
    "Transisi energi geotermal vulkanik dan mitigasi kebisingan uap bagi warga sekitar",
    "Dinamika pasar loak elektronik dan tantangan daur ulang limbah e-waste lokal"
  ],
  inggris: [
    // a) Narrative & Folklore
    "Narrative & Folklore: The Clever Mouse Deer and the River Crocodile — wits over brute force in Asian folklore",
    "Narrative & Folklore: Anansi and the Box of Stories — West African fable on sharing knowledge and humility",
    "Narrative & Folklore: The Legend of Lake Toba and the Fisherman's Oath — animal metamorphosis and moral values of broken trust",
    "Narrative & Folklore: The Tortoise and the Proud Leopard — African animal fable on moral perseverance and humility",

    // b) School & Campus Infographic
    "School & Campus Infographic: Library etiquette, borrowing procedures, and silent study zone regulations",
    "School & Campus Infographic: Study ergonomics, digital eye strain, and the Pomodoro revision technique",
    "School & Campus Infographic: Science laboratory safety rules, chemical hazard symbols, and emergency eyewash protocols",
    "School & Campus Infographic: Campus recycling program, e-waste segregation, and single-use plastic audit",

    // c) Nature & Eco-Tourism
    "Nature & Eco-Tourism: Raja Ampat marine biodiversity, endemic species, and sustainable community dive tourism",
    "Nature & Eco-Tourism: Great Barrier Reef coral bleaching resilience and larval restoration projects",
    "Nature & Eco-Tourism: Komodo dragon habitat preservation and carrying-capacity zoning in national parks",
    "Nature & Eco-Tourism: Mangrove conservation, blue carbon ecosystems, and coastal erosion barriers in Southeast Asia",

    // d) Career & Real Experience / Recount
    "Career & Real Experience / Recount: Diary of a community radio intern producing grassroots youth educational podcasts",
    "Career & Real Experience / Recount: Hands-on reflections of a wildlife rescue shelter volunteer rehabilitating sun bears",
    "Career & Real Experience / Recount: The journey of a high school robotics team preparing for the national championship",
    "Career & Real Experience / Recount: Practical lessons and growth of a teenage woodworking apprentice mastering joinery",

    // e) Teen Life & Applied Science
    "Teen Life & Applied Science: Smartphone screen time habits, circadian rhythms, and adolescent sleep hygiene",
    "Teen Life & Applied Science: Microplastics in seafood and bioaccumulation in human marine food webs",
    "Teen Life & Applied Science: Fast fashion environmental footprint, textile recycling, and circular economy",
    "Teen Life & Applied Science: Artificial intelligence writing assistants in high school education and academic integrity"
  ],
  matematika: [
    "Teknik Sipil: Beban struktur jembatan gantung, kelengkungan kabel parabola, dan pemuaian rangka baja",
    "Ekonomi Perbankan: Model amortisasi pinjaman, bunga majemuk anuitas, dan proyeksi inflasi portofolio investasi",
    "Fisika Mekanika: Trayektori proyektil sudut elevasi, osilasi pegas redaman, dan kecepatan sudut turbin angin",
    "Kriptografi IT: Transformasi matriks enkripsi Hill Cipher, fungsi hashing, dan kompleksitas komputasi modular",
    "Optimasi Industri Logistik: Minimasi biaya distribusi rantai pasok dan pemrograman linear rute armada pengiriman",
    "Statistika Terapan: Pengujian mutu sampling massal batch pabrik, estimasi risiko aktuaria, dan analisis regresi tren"
  ]
};

function getRandomThemes(pool, n) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * Generate a complete AI-crafted exam drill package strictly mirroring Pusmendik standards.
 */
async function generateAiDrillPackage({ subject = "Bahasa Indonesia", pola = "all", count = 5, topic = "", tier = "standard", model = "ag/gemini-3.8-flash-low" }) {
  const blueprintMap = SUBJECT_BLUEPRINTS[subject] || SUBJECT_BLUEPRINTS["Bahasa Indonesia"];
  const isEnglish = subject === "Bahasa Inggris";
  const isMath = subject === "Matematika";
  const isChallenge = tier === "challenge";

  let polaInstruction = "";
  if (pola === "all") {
    polaInstruction = `MANDATORI DISTRIBUSI KUOTA 6 POLA BAKU (MENGIKUTI STANDAR RESMI PUSMENDIK TKA):
Dilarang condong ke satu pola. Soal WAJIB didistribusikan secara proporsional:
1. ${blueprintMap[1]?.nama || "Pola 1"}: ~15% (Makna istilah/konsep dasar)
2. ${blueprintMap[2]?.nama || "Pola 2"}: ~15% (Gagasan payung/ide pokok/aljabar inti)
3. ${blueprintMap[3]?.nama || "Pola 3"}: ~25% (Fakta wacana & kausalitas/hubungan paragraf - porsi terbesar)
4. ${blueprintMap[4]?.nama || "Pola 4"}: ~15% (Tujuan/sikap penulis/simpulan)
5. ${blueprintMap[5]?.nama || "Pola 5"}: ~15% (Format Tabel Pernyataan / Multi-Checkbox evaluatif)
6. ${blueprintMap[6]?.nama || "Pola 6"}: ~15% (Teks Sastra/Analisis Khusus)
Setiap objek butir soal WAJIB mencantumkan field "pola": 1..6 sesuai pola yang diuji!`;
  } else {
    const selectedPola = blueprintMap[pola] || blueprintMap[1];
    polaInstruction = `FOKUS SOAL 100% PADA: ${selectedPola.nama}\nDeskripsi: ${selectedPola.deskripsi}\nTipe Soal: ${selectedPola.tipe_soal}`;
  }

  const systemPrompt = `Kamu adalah Auditor Ahli Asesmen Pusmendik Kemendikdasmen untuk Tes Kemampuan Akademik (TKA SMA Kelas 12) mata pelajaran ${subject}.
Tugasmu adalah mencetak lembar naskah soal latihan standar resmi TKA SMA yang 100% presisi mengikuti cetakan stimulus dan 6 pola baku Pusmendik.

ATURAN STRUKTUR TEKS STIMULUS SESUAI MATA PELAJARAN:
${isMath ? `
- Untuk Matematika: Stimulus WAJIB RINGKAS & PADAT (50 - 100 kata studi kasus terapan / tabel spesifikasi numerik, BUKAN esai bertele-tele).
- Header wacana matematika WAJIB: <p><strong>Stimulus untuk soal nomor X s.d. Y</strong></p>.
- Rumus dan ekspresi aljabar WAJIB diapit tanda dolar KaTeX: inline $...$ atau block $$...$$, dengan double-backslash escape (\\\\frac, \\\\sqrt, dll) pada string JSON.
` : isEnglish ? `
- Untuk Bahasa Inggris: Teks bacaan, pertanyaan, dan pilihan jawaban WAJIB 100% ditulis dalam BAHASA INGGRIS AKADEMIK (standar resmi Pusmendik TKA SMA).
- Panjang passage minimal 200 - 280 kata dengan topik populer (nature, society, culture, education).
` : `
${isChallenge ? `
- MODE CHALLENGE (EKSTREM): Teks bacaan berbobot riset analitis mendalam (3-4 paragraf, 300-350 kata), kaya dialektika data vs paradoks, istilah teknis mendalam.
` : `
- MODE STANDAR TKA SMA PUSMENDIK (WAJAR & KOMUNIKATIF):
  * Gunakan bahasa Indonesia komunikatif dan wajar yang dipahami siswa SMA usia 17 tahun (standar naskah resmi Pusmendik seperti topik buwuhan, lingkungan pantai, nelayan melaut).
  * DILARANG KERAS menggunakan istilah teknis alien tingkat sarjana/jurnal (seperti organoleptik, deoksigenasi, hermatipik, dsb).
  * Panjang teks wajar: 200 - 250 kata (3 paragraf padat).
  * Cerpen sastra: Bahasa mengalir wajar tentang konflik keluarga, persahabatan, atau harapan pemuda desa.
`}
- Untuk Sosiologi: Angkat kasus nyata masyarakat (konflik lahan, dinamika kelompok, stratifikasi, perubahan sosial).
- Untuk Ekonomi: Angkat kasus nyata perekonomian (inflasi pangan, mekanisme pasar beras, suku bunga BI, neraca ekspor-impor).
- Untuk Bahasa Indonesia: Teks artikel populer atau cerpen sastra berbobot moral.
`}

POLA BAKU ${subject.toUpperCase()} YANG WAJIB DIIKUTI:
${polaInstruction}

ATURAN KESERAGAMAN SINTAKSIS OPSI (PUSMENDIK SYNTACTIC PARALLELISM):
1. PARALELISME STRUKTUR: Kelima opsi (a, b, c, d, e) WAJIB memiliki konstruksi kata awal yang SERAGAM:
   - Jika opsi [a] diawali nomina ("penjelasan...", "perbedaan..."), maka [b], [c], [d], [e] WAJIB diawali nomina serupa.
   - Jika opsi [a] diawali verba ("tidak kunjung pulang...", "tidak membawa..."), maka [b], [c], [d], [e] WAJIB diawali verba serupa.
   - Panjang kalimat kelima opsi WAJIB homogen (rata-rata 8 - 14 kata per opsi).
2. DILARANG KERAS MEMAKAI KATA PENANDA JEBAKAN KARTUN:
   - Dilarang keras memakai kata murahan seperti "selalu", "pasti", "semua", "hanya", "tidak pernah", "sepenuhnya", "mutlak", "menolak mentah-mentah", "satu-satunya".
   - Kata-kata tersebut membuat opsi salah terlalu mudah ditebak dan merusak kualitas ujian!
3. TEKNIK PENGECOH ASLI PUSMENDIK:
   - Pengecoh 1: Mengambil kalimat utuh paragraf lain yang benar secara fakta teks, tetapi bukan jawaban yang ditanyakan (Cross-Context Distractor).
   - Pengecoh 2: Kalimat yang 95% persis dengan teks, tetapi 1 kata kuncinya diganti atau dibalik hubungannya.
   - Pengecoh 3: Asumsi yang sangat masuk akal dan bijak di dunia nyata, tetapi tidak tertulis di teks wacana.

CONTOH ASLI PUSMENDIK DARI NASKAH RESMI:
- Contoh Soal Sastra (Pusmendik Paket 2 No 6):
  Pertanyaan: Apa yang menyebabkan Layur kesal kepada Bapak?
  [a] Tidak pamit kepada Layur saat hendak berlayar
  [b] Tidak membawa banyak ikan dari laut
  [c] Tidak setuju Layur menunggu terlalu lama di pantai
  [d] Tidak kunjung pulang setelah enam hari melaut (KUNCI)
  [e] Tidak menepati janjinya untuk pulang tepat waktu ketika melaut (JEBAKAN ASUMSI LUAR TEKS)

- Contoh Soal Wacana/Ide Pokok (Pusmendik Paket 2 No 3):
  Pertanyaan: Hubungan makna paragraf kedua dan ketiga adalah ....
  [a] perbedaan jenis buwuhan berdasarkan jenis acara yang dilangsungkan
  [b] penjelasan sebab dan akibat dari perbedaan pandangan mengenai buwuhan (KUNCI)
  [c] penjelasan dampak buruk dari adanya pandangan buwuhan sebagai sedekah
  [d] perbedaan tata cara buwuhan pada beberapa kelurahan atau desa di Surabaya
  [e] penjelasan hubungan hukum agama dengan pengertian masyarakat terhadap buwuhan

FORMAT OUTPUT WAJIB JSON MURNI:
{
  "title": "Paket Latihan AI - ${subject} [Topik]",
  "bacaan": "<p><strong>Judul Teks</strong></p><p>Paragraf 1...</p>",
  "items": [
    {
      "nomor": 1,
      "pola": 1,
      "tipe_soal": "pilihan_ganda",
      "soal": "<p>Pertanyaan nomor 1...</p>",
      "options": [
        {"id": "a", "text": "Opsi A"},
        {"id": "b", "text": "Opsi B"},
        {"id": "c", "text": "Opsi C"},
        {"id": "d", "text": "Opsi D"},
        {"id": "e", "text": "Opsi E"}
      ],
      "kunci_jawaban": "a",
      "kunci_jawaban_text": "Pembahasan rinci berdasarkan teks atau penurunan rumus..."
    }
  ]
}

PENTING ATURAN KUNCI JAWABAN:
- MANDATORI JUMLAH BUTIR: Kamu WAJIB menghasilkan TEPAT ${count} butir soal bernomor urut 1 sampai ${count} tanpa terkecuali.
- Untuk kunci_jawaban_text: tuliskan 1 kalimat padat dan to the point membongkar bukti teks & jebakan (dilarang bertele-tele agar seluruh ${count} butir soal tuntas lengkap tanpa terpotong).
- Untuk pilihan_ganda: huruf tunggal ("a", "b", "c", "d", atau "e").
- Untuk pilihan_ganda_kompleks: huruf dipisah titik koma ("b;d").
- Untuk pernyataan: format pasangan dipisah titik koma ("a:benar;b:salah;c:benar" atau "a:setuju;b:tidak setuju;c:tidak setuju").
- Jawaban harus 100% berakar kuat di dalam stimulus teks/kasus yang dibuat!`;

  const defaultTopic = isMath
    ? "Penerapan Transformasi Geometri dan Sistem Aljabar Kuadrat pada Desain Arsitektur Modern"
    : isEnglish
    ? "The Ecological Impact of Ocean Acidification and Microplastic Accumulation on Marine Food Webs"
    : subject === "Ekonomi"
    ? "Dilema Inflasi Pangan Menjelang Hari Raya dan Bauran Kebijakan Moneter-Fiskal"
    : subject === "Sosiologi"
    ? "Dinamika Konflik Sosial antara Pedagang Tradisional dan Pengembang Modern di Wilayah Perkotaan"
    : "Dilema Pelestarian Tradisi Adat di Tengah Gelombang Komersialisasi Wisata Digital";

  const targetCount = Math.max(1, parseInt(count, 10) || 5);

  // Pusmendik Unit Clustering Blueprint (Authentic diverse domains across units)
  const sampledCerpen = getRandomThemes(DIVERSE_THEME_POOLS.cerpen, 6);
  const sampledArtikel = getRandomThemes(DIVERSE_THEME_POOLS.artikel, 8);
  const sampledInggris = getRandomThemes(DIVERSE_THEME_POOLS.inggris, DIVERSE_THEME_POOLS.inggris.length);
  const mathThemes = DIVERSE_THEME_POOLS.matematika;

  let unitDefs = [];
  if (pola !== "all") {
    const selectedPola = blueprintMap[pola] || blueprintMap[1];
    const isSastraPola = ["6", "7", "8", "9"].includes(String(selectedPola.id)) || selectedPola.nama.toLowerCase().includes("sastra") || selectedPola.nama.toLowerCase().includes("cerpen");
    const themePool = isMath ? mathThemes : isEnglish ? sampledInggris : (isSastraPola ? sampledCerpen : sampledArtikel);
    unitDefs = [];
    let cur = 1;
    let themeIdx = 0;
    while (cur <= targetCount) {
      const end = Math.min(cur + 4, targetCount);
      const chosenTheme = themePool[themeIdx % themePool.length];
      unitDefs.push({
        start: cur,
        end: end,
        type: `${subject} — ${chosenTheme} (${selectedPola.nama})`,
        polas: selectedPola.nama,
        polaId: selectedPola.id
      });
      cur = end + 1;
      themeIdx++;
    }
  } else if (isMath) {
    // Alokasi 6 Pola Baku Matematika Pusmendik (Teknik, Keuangan, Fisika, Kripto, Optimasi, Statistika)
    if (targetCount === 25) {
      unitDefs = [
        {
          start: 1, end: 4,
          type: `Teknik Sipil (${mathThemes[0]})`,
          polas: "Pola 1 — Transformasi Geometri Kurva",
          polaId: 1
        },
        {
          start: 5, end: 8,
          type: `Ekonomi Perbankan (${mathThemes[1]})`,
          polas: "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat",
          polaId: 2
        },
        {
          start: 9, end: 12,
          type: `Kriptografi IT (${mathThemes[3]})`,
          polas: "Pola 3 — SPLDV & Pemodelan Matriks Terapan",
          polaId: 3
        },
        {
          start: 13, end: 17,
          type: `Optimasi Industri Logistik (${mathThemes[4]})`,
          polas: "Pola 4 — Barisan & Deret Aritmetika/Geometri",
          polaId: 4
        },
        {
          start: 18, end: 21,
          type: `Fisika Mekanika (${mathThemes[2]})`,
          polas: "Pola 5 — Trigonometri & Dimensi Tiga Dasar",
          polaId: 5
        },
        {
          start: 22, end: 25,
          type: `Statistika Terapan (${mathThemes[5]})`,
          polas: "Pola 6 — Statistika & Peluang Terapan (Kombinatorika/Himpunan)",
          polaId: 6
        }
      ];
    } else if (targetCount === 20) {
      unitDefs = [
        { start: 1, end: 3, type: `Teknik Sipil (${mathThemes[0]})`, polas: "Pola 1 — Transformasi Geometri Kurva", polaId: 1 },
        { start: 4, end: 6, type: `Ekonomi Perbankan (${mathThemes[1]})`, polas: "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat", polaId: 2 },
        { start: 7, end: 10, type: `Kriptografi IT (${mathThemes[3]})`, polas: "Pola 3 — SPLDV & Pemodelan Matriks Terapan", polaId: 3 },
        { start: 11, end: 13, type: `Optimasi Industri Logistik (${mathThemes[4]})`, polas: "Pola 4 — Barisan & Deret Aritmetika/Geometri", polaId: 4 },
        { start: 14, end: 16, type: `Fisika Mekanika (${mathThemes[2]})`, polas: "Pola 5 — Trigonometri & Dimensi Tiga Dasar", polaId: 5 },
        { start: 17, end: 20, type: `Statistika Terapan (${mathThemes[5]})`, polas: "Pola 6 — Statistika & Peluang Terapan (Kombinatorika/Himpunan)", polaId: 6 }
      ];
    } else if (targetCount === 30) {
      unitDefs = [
        { start: 1, end: 5, type: `Teknik Sipil (${mathThemes[0]})`, polas: "Pola 1 — Transformasi Geometri Kurva", polaId: 1 },
        { start: 6, end: 10, type: `Ekonomi Perbankan (${mathThemes[1]})`, polas: "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat", polaId: 2 },
        { start: 11, end: 15, type: `Kriptografi IT (${mathThemes[3]})`, polas: "Pola 3 — SPLDV & Pemodelan Matriks Terapan", polaId: 3 },
        { start: 16, end: 20, type: `Optimasi Industri Logistik (${mathThemes[4]})`, polas: "Pola 4 — Barisan & Deret Aritmetika/Geometri", polaId: 4 },
        { start: 21, end: 25, type: `Fisika Mekanika (${mathThemes[2]})`, polas: "Pola 5 — Trigonometri & Dimensi Tiga Dasar", polaId: 5 },
        { start: 26, end: 30, type: `Statistika Terapan (${mathThemes[5]})`, polas: "Pola 6 — Statistika & Peluang Terapan (Kombinatorika/Himpunan)", polaId: 6 }
      ];
    } else if (targetCount === 10) {
      unitDefs = [
        {
          start: 1, end: 5,
          type: `Teknik Sipil & Pemodelan Rekayasa (${mathThemes[0]})`,
          polas: "Pola 1 (Transformasi Geometri Kurva), Pola 2 (Aljabar Pecahan/Kuadrat), Pola 3 (SPLDV & Matriks Terapan)",
          polaId: 1
        },
        {
          start: 6, end: 10,
          type: `Finansial & Riset Operasi (${mathThemes[1]})`,
          polas: "Pola 4 (Barisan & Deret Aritmetika/Geometri), Pola 5 (Trigonometri & Dimensi Tiga Dasar), Pola 6 (Statistika & Peluang Terapan)",
          polaId: 4
        }
      ];
    } else {
      // 5 Butir atau custom count
      unitDefs = [
        {
          start: 1, end: targetCount,
          type: `Matematika Terapan & Rekayasa (${mathThemes[0]})`,
          polas: "Pola 1 s/d Pola 6 (Transformasi Geometri, Aljabar Kuadrat, SPLDV/Matriks Terapan, Barisan Deret, Trigonometri & Dimensi Tiga, Statistika Terapan)",
          polaId: 1
        }
      ];
    }
  } else if (isEnglish) {
    // Blueprint Otentik Bahasa Inggris Pusmendik (5 Klaster Genre Resmi Pusmendik)
    const findGenreTheme = (genrePrefix) => {
      const match = sampledInggris.find(t => t.startsWith(genrePrefix));
      return match || sampledInggris[0];
    };

    const genreNarrative = findGenreTheme("Narrative & Folklore");
    const genreInfographic = findGenreTheme("School & Campus Infographic");
    const genreNature = findGenreTheme("Nature & Eco-Tourism");
    const genreRecount = findGenreTheme("Career & Real Experience / Recount");
    const genreTeenLife = findGenreTheme("Teen Life & Applied Science");

    if (targetCount === 25) {
      unitDefs = [
        {
          start: 1, end: 5,
          genre: "narrative",
          type: `Academic Narrative & Folklore — ${genreNarrative}`,
          polas: "No 1 (Pola 1 — Main Idea / Theme), No 2 (Pola 2 — Stated Detail / Character Conflict), No 3 (Pola 5 — Pernyataan / Character Traits Table 3 rows), No 4 (Pola 5 — Contextual Vocabulary / Moral Symbolism), No 5 (Pola 4 — PG Kompleks Moral Lesson / Resolution)"
        },
        {
          start: 6, end: 10,
          genre: "infographic",
          type: `School & Campus Infographic — ${genreInfographic}`,
          polas: "No 6 (Pola 5 — Pernyataan Infografis / Table 3 rows), No 7 (Pola 2 — PG Kompleks Multi-Answer Scanning), No 8 (Pola 6 — Target Audience / Purpose), No 9 (Pola 3 — Negative Detail / NOT mentioned), No 10 (Pola 4 — Action Implication / Practical Recommendation)"
        },
        {
          start: 11, end: 15,
          genre: "nature",
          type: `Nature & Eco-Tourism — ${genreNature}`,
          polas: "No 11 (Pola 6 — Author Tone & Stance), No 12 (Pola 1 — Primary Topic / Central Focus), No 13 (Pola 2 — Stated Detail Fact), No 14 (Pola 4 — Ecological Cause & Effect / Scientific Inference), No 15 (Pola 5 — Technical Vocabulary)"
        },
        {
          start: 16, end: 20,
          genre: "recount",
          type: `Career & Real Experience / Recount — ${genreRecount}`,
          polas: "No 16 (Pola 1 — Main Experience / Purpose of Recount), No 17 (Pola 2 — Chronological Sequence of Events), No 18 (Pola 2 — Stated Challenges & Key Decisions), No 19 (Pola 4 — PG Kompleks Author Reflection / Lessons Learned), No 20 (Pola 6 — Author Attitude & Perspective)"
        },
        {
          start: 21, end: 25,
          genre: "teen_science",
          type: `Teen Life & Applied Science — ${genreTeenLife}`,
          polas: "No 21 (Pola 1 — Thesis Statement / Central Argument), No 22 (Pola 2 — Paragraph Function & Supporting Evidence), No 23 (Pola 3 — Counter-argument & Factual Verification), No 24 (Pola 4 — PG Kompleks Multiple Implications / What-If), No 25 (Pola 6 — Text Summary & Concluding Evaluation)"
        }
      ];
    } else if (targetCount === 20) {
      unitDefs = [
        {
          start: 1, end: 5,
          genre: "narrative",
          type: `Academic Narrative & Folklore — ${genreNarrative}`,
          polas: "No 1 (Pola 1 — Main Idea / Outline), No 2 (Pola 2 — Stated Detail / Explicit Fact), No 3 (Pola 5 — Pernyataan / Character Traits Table 3 rows), No 4 (Pola 5 — Vocabulary in Context), No 5 (Pola 4 — PG Kompleks Main Lesson / Moral Value)"
        },
        {
          start: 6, end: 10,
          genre: "infographic",
          type: `School & Campus Infographic — ${genreInfographic}`,
          polas: "No 6 (Pola 5 — Pernyataan Infografis / Table 3 rows), No 7 (Pola 2 — PG Kompleks Multi-Answer Scanning), No 8 (Pola 6 — Target Audience / Purpose), No 9 (Pola 3 — Negative Detail / NOT mentioned), No 10 (Pola 4 — Action Implication / Inference)"
        },
        {
          start: 11, end: 15,
          genre: "nature",
          type: `Nature & Eco-Tourism — ${genreNature}`,
          polas: "No 11 (Pola 6 — Author Tone & Stance), No 12 (Pola 1 — Primary Topic), No 13 (Pola 2 — Stated Detail Fact), No 14 (Pola 4 — Scientific Inference), No 15 (Pola 5 — Technical Vocabulary)"
        },
        {
          start: 16, end: 20,
          genre: "recount",
          type: `Career & Real Experience / Recount — ${genreRecount}`,
          polas: "No 16 (Pola 1 — Thesis Statement / Main Event), No 17 (Pola 2 — Chronological Sequence), No 18 (Pola 2 — Factual Extraction), No 19 (Pola 4 — PG Kompleks Multiple Implication), No 20 (Pola 6 — Text Structure / Summary)"
        }
      ];
    } else if (targetCount === 10) {
      unitDefs = [
        {
          start: 1, end: 5,
          genre: "narrative",
          type: `Academic Narrative & Culture — ${genreNarrative}`,
          polas: "No 1 (Pola 1 — Main Points / Outline), No 2 (Pola 2 — Cause & Effect / Stated Detail), No 3 (Pola 5 — Pernyataan / Character Comparison Table 3 rows), No 4 (Pola 5 — Contextual Phrase Meaning), No 5 (Pola 4 — PG Kompleks Moral Lesson)"
        },
        {
          start: 6, end: 10,
          genre: "infographic",
          type: `School & Campus Infographic — ${genreInfographic}`,
          polas: "No 6 (Pola 5 — Pernyataan / Infographic Category Table 3 rows), No 7 (Pola 2 — PG Kompleks Multiple Fact Verification), No 8 (Pola 6 — Intended Reader / Author Purpose), No 9 (Pola 3 — Negative Detail / Unstated Fact), No 10 (Pola 4 — Practical Action & Recommendation)"
        }
      ];
    } else {
      // 5 Butir atau custom
      const singleTheme = sampledInggris[Math.floor(Math.random() * sampledInggris.length)] || sampledInggris[0];
      unitDefs = [
        {
          start: 1, end: targetCount,
          type: `Reading Comprehension — ${singleTheme}`,
          polas: "No 1 (Pola 1 — Main Idea), No 2 (Pola 2 — Stated Fact), No 3 (Pola 5 — Vocabulary in Context), No 4 (Pola 4 — Inference), No 5 (Pola 6 — Author's Purpose)"
        }
      ];
    }
  } else if (targetCount === 25) {
    unitDefs = [
      {
        start: 1, end: 4,
        type: `Artikel Sains & Lingkungan (${sampledArtikel[0]})`,
        polas: "No 1 (Makna Istilah), No 2 (Ide Pokok), No 3 (Kausalitas Teks - 'tipe_soal': 'pilihan_ganda_kompleks', 2 opsi benar misal 'a;d'), No 4 (Fungsi/Tujuan Kalimat Penutup)"
      },
      {
        start: 5, end: 8,
        type: `Cerpen Sastra Tradisi & Keluarga (${sampledCerpen[0]})`,
        polas: "No 5 (Watak Tokoh), No 6 (Pemicu Konflik), No 7 (Rekonstruksi Akhir Cerita Resolusi), No 8 (Reaksi Emosi Tokoh)"
      },
      {
        start: 9, end: 12,
        type: `Cerpen Sastra Dinamika Warga (${sampledCerpen[1]})`,
        polas: "No 9 (Urutan Kronologis Plot), No 10 (Pesan Moral/Amanat - 'tipe_soal': 'pilihan_ganda_kompleks', 2 opsi benar), No 11 (Relevansi Sindiran/Nilai Sosial ke Realitas), No 12 (Hubungan Makna Antar-paragraf)"
      },
      {
        start: 13, end: 17,
        type: `Artikel Ekonomi & Kebijakan Publik (${sampledArtikel[1]})`,
        polas: "No 13 (Tabel Pernyataan Kesesuaian Fakta - 'tipe_soal': 'pernyataan', 3 baris Benar/Salah), No 14 (Makna Istilah/Metafora), No 15 (Fenomena Konsep Teks), No 16 (Fakta Wacana - 'tipe_soal': 'pilihan_ganda_kompleks'), No 17 (Prediksi Kelanjutan Teks)"
      },
      {
        start: 18, end: 21,
        type: `Cerpen Sastra Dilema Komunitas (${sampledCerpen[2]})`,
        polas: "No 18 (Latar Tempat & Suasana), No 19 (Penyebab Konflik Batin), No 20 (Prediksi Tindakan Tokoh / What-If), No 21 (Tabel Kesesuaian Karakter & Tindakan - 'tipe_soal': 'pernyataan', 3 baris)"
      },
      {
        start: 22, end: 25,
        type: `Artikel Sosio-Budaya Tradisi (${sampledArtikel[2]})`,
        polas: "No 22 (Makna Kata Budaya/Daerah), No 23 (Gagasan Penjelas Pendukung Ide Pokok), No 24 (Hubungan Makna Antar-paragraf), No 25 (Simpulan Akhir Wacana)"
      }
    ];
  } else if (targetCount === 20) {
    unitDefs = [
      { start: 1, end: 4, type: `Sains Kebumian & Ekologi (${sampledArtikel[0]})`, polas: "No 1 (Kosakata), No 2 (Ide Pokok), No 3 (Kausalitas - PG Kompleks), No 4 (Simpulan)" },
      { start: 5, end: 8, type: `Cerpen Sastra Dinamika Warga (${sampledCerpen[0]})`, polas: "No 5 (Watak Tokoh), No 6 (Konflik Batin), No 7 (Rekonstruksi Akhir), No 8 (Relevansi Sosial)" },
      { start: 9, end: 12, type: `Artikel Industri & Kesehatan (${sampledArtikel[1]})`, polas: "No 9 (Tujuan Penulis), No 10 (Tabel Pernyataan - 3 baris), No 11 (Makna Istilah), No 12 (Simpulan)" },
      { start: 13, end: 16, type: `Cerpen Sastra Reflektif (${sampledCerpen[1]})`, polas: "No 13 (Amanat Moral), No 14 (Latar Suasana), No 15 (Prediksi What-If), No 16 (Tabel Karakter)" },
      { start: 17, end: 20, type: `Teknologi Hijau & Kebijakan (${sampledArtikel[2]})`, polas: "No 17 (Kata Serapan), No 18 (Hubungan Makna Kalimat), No 19 (Fakta Wacana - PG Kompleks), No 20 (Kalimat Penutup)" }
    ];
  } else if (targetCount === 30) {
    unitDefs = [
      { start: 1, end: 4, type: `Sains Alam (${sampledArtikel[0]})`, polas: "Pola 1, Pola 2, Pola 3 (PG Kompleks), Pola 4" },
      { start: 5, end: 8, type: `Cerpen Sastra Tradisi (${sampledCerpen[0]})`, polas: "Pola 6 (Watak, Konflik, Rekonstruksi, Amanat)" },
      { start: 9, end: 13, type: `Ekologi & Konservasi (${sampledArtikel[1]})`, polas: "Pola 3, Pola 5 (Tabel Pernyataan 3 baris), Pola 1" },
      { start: 14, end: 17, type: `Cerpen Sastra Kehidupan (${sampledCerpen[1]})`, polas: "Pola 6 (Konflik Tokoh, Latar Suasana, What-If)" },
      { start: 18, end: 21, type: `Makroekonomi Kebijakan (${sampledArtikel[2]})`, polas: "Pola 3, Pola 5 (Pilihan Ganda Kompleks)" },
      { start: 22, end: 25, type: `Cerpen Sastra Persahabatan (${sampledCerpen[2]})`, polas: "Pola 6, Pola 8, Pola 9, Pola 11" },
      { start: 26, end: 30, type: `Antropologi Kekerabatan (${sampledArtikel[3]})`, polas: "Pola 1, Pola 2, Pola 3, Pola 4, Pola 5" }
    ];
  } else if (targetCount === 10) {
    unitDefs = [
      {
        start: 1, end: 5,
        type: `Artikel Sains & Fenomena (${sampledArtikel[0]})`,
        polas: "No 1 (Makna Istilah), No 2 (Ide Pokok), No 3 (Kausalitas Teks - 'tipe_soal': 'pilihan_ganda_kompleks', 2 opsi benar), No 4 (Tujuan/Fungsi Kalimat), No 5 (Tabel Kesesuaian Fakta - 'tipe_soal': 'pernyataan', 3 baris Benar/Salah)"
      },
      {
        start: 6, end: 10,
        type: `Cerpen Sastra Humanis (${sampledCerpen[0]})`,
        polas: "No 6 (Watak Tokoh), No 7 (Penyebab Konflik), No 8 (Prediksi Skenario What-If), No 9 (Rekonstruksi Akhir Cerita), No 10 (Pesan Moral & Relevansi Sosial - 'tipe_soal': 'pilihan_ganda_kompleks', 2 opsi benar)"
      }
    ];
  } else {
    // 5 Butir
    unitDefs = [
      { start: 1, end: targetCount, type: `Sains Analitis (${sampledArtikel[0]})`, polas: "Pola 1 s/d Pola 6" }
    ];
  }

  // Generate all units in parallel
  const tasks = unitDefs.map(u => {
    const unitCount = u.end - u.start + 1;
    const polaIdStr = String(u.polaId || "");
    const isCerpen = ["6", "7", "8", "9"].includes(polaIdStr) || u.type.toLowerCase().includes("cerpen") || u.type.toLowerCase().includes("sastra");
    const isDual = polaIdStr === "10";
    const isDialogEval = polaIdStr === "11";
    const isWhatIf = polaIdStr === "7";
    const isChronology = polaIdStr === "8";
    const isRelevance = polaIdStr === "9";
    const unitDomain = topic.trim() ? `${u.type} (Konteks spesifik: ${topic.trim()})` : u.type;

    const targetWordCount = isChallenge ? "300 - 360 KATA (Level Riset Akademis/Challenge)" : "200 - 250 KATA (Standar Resmi Pusmendik SMA Kelas 12)";
    const unitPrompt = isMath
      ? `Buatkan stimulus matematika terapan standar resmi Pusmendik dan TEPAT ${unitCount} butir soal bernomor urut ${u.start} sampai ${u.end}.

ATURAN WAJIB STIMULUS MATEMATIKA PUSMENDIK:
1. PANJANG STIMULUS WAJIB RINGKAS & PADAT: 50 - 100 KATA (studi kasus terapan / tabel spesifikasi numerik / parameter desain teknis. DILARANG KERAS membuat narasi esai panjang bertele-tele!).
2. HEADER WACANA WAJIB:
<p><strong>Stimulus untuk soal nomor ${u.start} s.d. ${u.end}</strong></p>
3. MANDATORI RUMUS KATEX & DOUBLE-BACKSLASH ESCAPING:
   - Rumus pada wacana, teks soal, opsi jawaban, dan pembahasan WAJIB diapit tanda dolar: inline $...$ atau block $$...$$.
   - Pada string JSON, karakter backslash LaTeX WAJIB di-double escape (contoh: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\alpha, \\\\le, \\\\ge, \\\\pm, \\\\times) agar valid secara sintaksis JSON dan tidak menghasilkan invalid escape control sequence.
4. TOPIK & POLA BAKU:
   - Topik Studi Kasus: ${unitDomain}
   - Fokus Pola Uji: ${u.polas}
5. OPSI JAWABAN:
   - 5 pilihan jawaban (a, b, c, d, e) wajib seragam formatnya (semua ekspresi matematika atau nilai numerik dengan satuan konsisten).

SKEMA JSON OUTPUT LENGKAP:
{
  "bacaan": "<p><strong>Stimulus untuk soal nomor ${u.start} s.d. ${u.end}</strong></p><p>Studi kasus terapan ringkas 50-100 kata dengan parameter numerik dan rumus KaTeX $...$</p>",
  "items": [
    {
      "nomor": ${u.start},
      "pola": ${u.polaId || 1},
      "tipe_soal": "pilihan_ganda",
      "soal": "<p>Pertanyaan matematika berbasis stimulus di atas dengan rumus KaTeX $...$</p>",
      "options": [
        {"id": "a", "text": "$...$"},
        {"id": "b", "text": "$...$"},
        {"id": "c", "text": "$...$"},
        {"id": "d", "text": "$...$"},
        {"id": "e", "text": "$...$"}
      ],
      "kunci_jawaban": "a",
      "kunci_jawaban_text": "Langkah penyelesaian sistematis dan ringkas dengan penurunan rumus..."
    }
  ]
}`
      : isEnglish
      ? (() => {
          let englishGenreInstruction = "";
          const lowerType = u.type.toLowerCase();
          if (lowerType.includes("narrative") || lowerType.includes("folklore") || lowerType.includes("fable")) {
            englishGenreInstruction = `GENRE MANDATE: NARRATIVE & FOLKLORE
- Passage MUST feature vivid characters, an inciting conflict, rising action, and a clear moral resolution (Asian/African folklore or animal moral fable).
- Questions must evaluate character traits/motivations, moral values, conflict turning points, and symbolic vocabulary.`;
          } else if (lowerType.includes("infographic")) {
            englishGenreInstruction = `GENRE MANDATE: SCHOOL & CAMPUS INFOGRAPHIC
- Passage MUST be structured like an authentic campus guide / infographic text with bullet points, practical tips, study/safety rules, or categorized advice.
- Questions must evaluate factual scanning, practical recommendations, intended audience, and category table statements (True/False or Agree/Disagree).`;
          } else if (lowerType.includes("recount") || lowerType.includes("career") || lowerType.includes("experience")) {
            englishGenreInstruction = `GENRE MANDATE: CAREER & REAL EXPERIENCE (RECOUNT)
- Passage MUST follow a chronological personal recount / journal of an internship, volunteer work, robotics team journey, or apprenticeship.
- Highlight specific milestones, real challenges encountered, personal growth, and reflective lessons learned.
- Questions must evaluate timeline chronology, author reflection, key decisions, and tone.`;
          } else if (lowerType.includes("nature") || lowerType.includes("eco-tourism") || lowerType.includes("biodiversity")) {
            englishGenreInstruction = `GENRE MANDATE: NATURE & ECO-TOURISM
- Passage MUST present scientific and conservation perspectives on habitats, biodiversity (e.g., Raja Ampat, coral reefs, Komodo, mangroves), and sustainable community eco-tourism.
- Questions must evaluate ecological cause-and-effect, author stance, scientific inferences, and technical vocabulary.`;
          } else if (lowerType.includes("teen life") || lowerType.includes("applied science")) {
            englishGenreInstruction = `GENRE MANDATE: TEEN LIFE & APPLIED SCIENCE
- Passage MUST investigate contemporary adolescent phenomena (e.g., sleep hygiene, microplastics, fast fashion circular economy, or high school AI) with empirical facts and societal implications.
- Questions must evaluate thesis arguments, paragraph functions, counter-arguments, and multi-faceted implications.`;
          } else {
            englishGenreInstruction = `GENRE MANDATE: ACADEMIC READING PASSAGE
- Provide a coherent, well-structured academic passage with clear paragraphs.
- Questions must test main ideas, explicit details, vocabulary, inferences, and author purpose.`;
          }

          return `Generate an authentic Pusmendik-standard Academic English reading stimulus and EXACTLY ${unitCount} questions numbered ${u.start} to ${u.end}.

PASSAGE REQUIREMENTS:
1. HEADER: The passage MUST start with exactly:
<p><strong>Questions ${u.start} to ${u.end} are based on the following passage.</strong></p>
2. LENGTH: ${isChallenge ? "260 - 340 words" : "200 - 260 words"} written in natural, high-standard academic English.
3. DOMAIN & TOPIC: ${unitDomain}
4. ${englishGenreInstruction}

QUESTION & ITEM SPECIFICATIONS:
- Produce EXACTLY ${unitCount} questions strictly numbered ${u.start} to ${u.end}.
- Tested competencies: ${u.polas}
- 5 answer options (a, b, c, d, e) of balanced length and grammatical parallel structure.
- 3 AUTHENTIC READING DISTRACTORS:
  * True Statement Wrong Question (factually true in passage but does not answer the question).
  * Extreme Words Distractor (inserts "completely", "always", "every").
  * Opposite Verb / Polarity Distractor (reverses core relationship).
- If testing Pola 5 (statement table): format with 3 statement rows ("a", "b", "c") and "labels": ["True", "False"] or ["Agree", "Disagree"] or ["Correct", "Incorrect"].

OUTPUT JSON SCHEMA:
{
  "bacaan": "<p><strong>Questions ${u.start} to ${u.end} are based on the following passage.</strong></p><p>...</p>",
  "items": [
    {
      "nomor": ${u.start},
      "pola": 1,
      "tipe_soal": "pilihan_ganda",
      "soal": "<p>According to the passage, ...</p>",
      "options": [
        {"id": "a", "text": "Option text..."},
        {"id": "b", "text": "Option text..."},
        {"id": "c", "text": "Option text..."},
        {"id": "d", "text": "Option text..."},
        {"id": "e", "text": "Option text..."}
      ],
      "kunci_jawaban": "a",
      "kunci_jawaban_text": "Detailed explanation justifying option A..."
    }
  ]
}`;
        })()
      : `Buatkan 1 wacana membaca standar resmi TKA Pusmendik (${targetWordCount}).
WACANA WAJIB DIAWALI HEADER HTML BERIKUT:
<p><strong>Teks untuk soal nomor ${u.start} s.d. ${u.end}</strong></p>

DOMAIN TOPIK WACANA INI: ${unitDomain}
FOKUS POLA UJI: ${u.polas}

${isDual ? `PETUNJUK WACANA DUAL-PASSAGE:
- Wacana WAJIB terdiri atas 2 teks terpisah:
  <p><strong>Teks 1</strong></p><p>[Paragraf Teks 1]</p>
  <p><strong>Teks 2</strong></p><p>[Paragraf Teks 2]</p>
- Topik sama, tetapi sudut pandang atau fokus berbeda (misal: aspek manfaat vs risiko lingkungan).
- Soal menguji perbandingan kedua teks (persamaan fokus, perbedaan sudut pandang, sintesis fakta).` : ""}
${isWhatIf ? `PETUNJUK KHUSUS WHAT-IF SASTRA:
- Soal wajib menguji konsekuensi hipotetis jika tindakan/keputusan tokoh diubah ("Apa yang kemungkinan besar terjadi seandainya tokoh...").` : ""}
${isChronology ? `PETUNJUK KHUSUS URUTAN PLOT & AKHIR CERITA:
- Soal menguji urutan peristiwa kronologis alur cerita atau memilih opsi kalimat/paragraf penutup yang selaras merekonstruksi resolusi cerita.` : ""}
${isRelevance ? `PETUNJUK KHUSUS RELEVANSI NILAI SOSIAL:
- Soal menguji keterkaitan nilai sosial, sindiran, kritik, atau amanat cerita dengan realitas dinamika masyarakat modern saat ini.` : ""}
${isDialogEval ? `PETUNJUK KHUSUS EVALUASI DIALOG PEMBACA:
- Tampilkan kutipan komentar atau dialog pembaca yang mengevaluasi isi teks.
- Soal bertipe pernyataan tabel 3 baris dengan labels ["Setuju", "Tidak Setuju"] untuk menilai keabsahan argumen komentar tersebut.` : ""}
${isCerpen ? `PETUNJUK KHUSUS CERPEN SASTRA:
- Panjang fragmen: ${isChallenge ? "300 - 340 kata" : "200 - 240 kata"}.
- Gunakan bahasa naratif mengalir wajar khas cerpen Indonesia (dialog keluarga, rekan kerja, sahabat, atau pengrajin).
- Tampilkan konflik batin yang jelas dan nilai sosial kehidupan nyata.
- ANTI-KLISE: DILARANG mengulang formula cerita klise (nelayan Sungai Siak, perahu bocor Pak Basri, Ardan bawa durian di kafe, atau mahar belis). Wajib buat nama tokoh, dialog, dan latar sosial baru sesuai tema unit!` : `PETUNJUK KHUSUS ARTIKEL ANALITIS:
- Panjang artikel: ${isChallenge ? "300 - 360 kata" : "200 - 240 kata (3 paragraf padat)"}.
- Bahasa Indonesia lugas, komunikatif, dan wajar dipahami siswa SMA usia 17 tahun.
- ANTI-KLISE: Gunakan topik analisis baru sesuai domain unit, jangan mengulang bahasan yang sama.
${!isChallenge ? "- DILARANG KERAS menggunakan istilah teknis alien tingkat sarjana/riset (seperti organoleptik, deoksigenasi, hermatipik, dsb)!" : ""}`}

STANDAR KETAT TINGKAT KESULITAN PUSMENDIK (HIGH DISCRIMINATION):
1. MANDATORI: Wajib hasilkan TEPAT ${unitCount} butir soal bernomor urut ${u.start} sampai ${u.end} yang 100% berakar kuat di wacana tersebut.
2. PANJANG OPSI HOMOGEN: Seluruh opsi jawaban (a, b, c, d, e) wajib memiliki panjang kalimat yang setara dan struktur kalimat yang seimbang.
3. JEBAKAN PENGECOH ASLI PUSMENDIK:
${isMath ? `   - KHUSUS MATEMATIKA (3 JEBAKAN KOGNITIF BAKU):
     * JEBAKAN PARTIAL STEP (LANGKAH TANGGUNG): Buat 1 opsi pengecoh dari hasil perhitungan setengah jalan (misal baru menemukan nilai x, padahal soal menanyakan 2x + 5y).
     * JEBAKAN TANDA MINUS/INVERS (SIGN FLIP): Buat 1 opsi dari kekeliruan pemindahan ruas / lupa tanda minus pada koordinat kuadran.
     * JEBAKAN BATAS/OVERLAP: Buat opsi dari kelalaian mengurangi irisan himpunan ganda atau salah membaca tanda batas pertidaksamaan (< vs <=).` : isEnglish ? `   - KHUSUS BAHASA INGGRIS (3 JEBAKAN READING BAKU):
     * JEBAKAN TRUE STATEMENT WRONG QUESTION: Buat 1 opsi yang pernyataannya 100% ADA di teks, tetapi BUKAN jawaban dari pertanyaan soal.
     * JEBAKAN EXTREME WORDS: Buat 1 opsi dengan menyisipkan kata kuantor ekstrem ("completely stop", "all teenagers", "always").
     * JEBAKAN OPPOSITE VERB: Buat 1 opsi yang membalik kata kerja inti (misal di teks "promotes health", di opsi ditulis "harms wellness").` : `   - DILARANG membuat opsi salah yang kentara konyol atau mudah dicoret!
   - 4 opsi pengecoh harus tampak 90% benar dan sangat meyakinkan:
     * Gunakan jebakan pembalikan arah kausalitas (sebab-akibat dibalik tipis).
     * Gunakan jebakan slip kualifikasi (teks menyebut "sebagian", opsi menyebut "seluruhnya/pasti").
     * Gunakan jebakan asumsi plausibel non-tekstual (pernyataan sangat masuk akal di dunia nyata, tetapi TIDAK ADA buktinya di teks wacana).`}
4. SOAL TABEL PERNYATAAN (Pola 5):
   - Gunakan format 3 baris pernyataan (id: "a", "b", "c").
   - Sertakan "labels": ["Benar", "Salah"] atau ["Sesuai", "Tidak Sesuai"] atau ["Setuju", "Tidak Setuju"].
   - Kunci jawaban wajib pasangan lengkap: contoh "a:sesuai;b:tidak sesuai;c:sesuai".

Format Output JSON Murni:
{
  "bacaan": "<p><strong>Teks untuk soal nomor ${u.start} s.d. ${u.end}</strong></p><p>Isi wacana lengkap...</p>",
  "items": [
    {
      "nomor": ${u.start},
      "pola": 1,
      "tipe_soal": "pilihan_ganda",
      "soal": "Pertanyaan berbobot analitis...",
      "options": [
        {"id": "a", "text": "Kalimat opsi A yang panjangnya setara dan meyakinkan."},
        {"id": "b", "text": "Kalimat opsi B yang panjangnya setara dan meyakinkan."},
        {"id": "c", "text": "Kalimat opsi C yang panjangnya setara dan meyakinkan."},
        {"id": "d", "text": "Kalimat opsi D yang panjangnya setara dan meyakinkan."},
        {"id": "e", "text": "Kalimat opsi E yang panjangnya setara dan meyakinkan."}
      ],
      "kunci_jawaban": "b",
      "kunci_jawaban_text": "Kunci B karena kalimat kedua secara eksplisit membuktikan hubungan tersebut, sedangkan opsi lain terkecoh asumsi luar teks."
    }
  ]
}`;

    return ai.callRouter(
      [{ role: "system", content: systemPrompt }, { role: "user", content: unitPrompt }],
      model,
      0.2,
      4096,
      120000
    );
  });

  const rawResponses = await Promise.all(tasks);
  let allItems = [];
  let firstBacaan = "";

  rawResponses.forEach((raw, idx) => {
    const u = unitDefs[idx];
    const parsed = safeJsonParse(raw);
    const defaultHeader = isMath
      ? `<p><strong>Stimulus untuk soal nomor ${u.start} s.d. ${u.end}</strong></p>`
      : isEnglish
      ? `<p><strong>Questions ${u.start} to ${u.end} are based on the following passage.</strong></p>`
      : `<p><strong>Teks untuk soal nomor ${u.start} s.d. ${u.end}</strong></p>`;
    let unitBacaan = parsed?.bacaan || defaultHeader;
    if (isEnglish && !unitBacaan.includes("are based on the following passage")) {
      unitBacaan = unitBacaan.replace(/<p><strong>(?:Teks|Stimulus) untuk soal nomor \d+ s\.d\. \d+<\/strong><\/p>/gi, "");
      unitBacaan = `${defaultHeader}${unitBacaan}`;
    }
    if (!firstBacaan) firstBacaan = unitBacaan;

    let unitItems = [];
    if (Array.isArray(parsed)) {
      unitItems = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.items)) unitItems = parsed.items;
      else if (Array.isArray(parsed.soal)) unitItems = parsed.soal;
    }

    // Attach unit wacana to every item in this unit
    unitItems.forEach((it, i) => {
      it.nomor = u.start + i;
      it.bacaan = it.bacaan || unitBacaan;
    });

    allItems.push(...unitItems);
  });

  if (allItems.length === 0) {
    throw new Error("Gagal mem-parsing paket soal dari AI (format respons tidak valid)");
  }

  // Ensure strict sequential numbering 1 to targetCount
  allItems = allItems.slice(0, targetCount);
  allItems.forEach((it, idx) => {
    it.nomor = idx + 1;
  });

  const title = `Paket Latihan AI - ${subject} [${targetCount} Butir ${isChallenge ? "Mode Challenge" : "Standar Pusmendik"}]`;
  return { title, bacaan: firstBacaan, items: allItems };
}

module.exports = {
  SUBJECT_BLUEPRINTS,
  POLA_BLUEPRINT: SUBJECT_BLUEPRINTS["Bahasa Indonesia"],
  DIVERSE_THEME_POOLS,
  generateAiDrillPackage
};
