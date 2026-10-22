// Cek perilaku mathify(). Jalankan: node server/utils/mathify.test.js
const assert = require("node:assert");
const { mathify } = require("./mathify");

const cases = [
  // [input, expected, keterangan]
  ["rumus a^m × a^n = a^(m+n)", "rumus $a^m$ × $a^n$ = $a^{m+n}$", "pangkat dasar + kurung"],
  ["Nilai dari 2^5 adalah 32", "Nilai dari $2^5$ adalah 32", "pangkat numerik"],
  ["U_n = a + (n-1)b", "$U_n$ = a + (n-1)b", "subskrip"],
  ["a^{m+n} tetap", "$a^{m+n}$ tetap", "brace sudah ada"],
  ["sudah $a^m$ benar", "sudah $a^m$ benar", "jangan dobel bungkus"],
  ["$$a^m \\times a^n$$", "$$a^m \\times a^n$$", "block math utuh"],
  ["kode `a^m` jangan diubah", "kode `a^m` jangan diubah", "inline code"],
  ["```\nx^2\n```", "```\nx^2\n```", "fenced code"],
  ["snake_case_name tetap", "snake_case_name tetap", "identifier panjang bukan math"],
  ["[salah_hitung] tetap", "[salah_hitung] tetap", "tag penanda jangan jadi math"],
  ["file_name.txt", "file_name.txt", "nama file"],
  ["https://x.com/a_b", "https://x.com/a_b", "URL"],
  ["tidak ada rumus sama sekali", "tidak ada rumus sama sekali", "teks polos"],
  ["H_2O", "$H_2$O", "kimia: subskrip memang math"],
  ["x_1 dan x_2", "$x_1$ dan $x_2$", "dua token"],
  ["a^10", "$a^10$", "pangkat dua digit"],
  ["2^(5 + 3) = 2^8", "$2^{5 + 3}$ = $2^8$", "kurung berspasi"],
  ["", "", "string kosong"],
  [null, null, "null aman"],
  ["a^m^x", "$a^m$^x", "chained tetap terbatas"],
  ["v1_2_3", "v1_2_3", "versi: underscore ganda dicegah"],
  // Bare LaTeX commands → auto-wrap
  ["rumus \\frac{3}{4} itu", "rumus $\\frac{3}{4}$ itu", "bare \\frac"],
  ["nilai \\sqrt{9} = 3", "nilai $\\sqrt{9}$ = 3", "bare \\sqrt"],
  ["lalu \\dots berikutnya", "lalu $\\dots$ berikutnya", "bare \\dots"],
  ["3 \\times 5 = 15", "3 $\\times$ 5 = 15", "bare \\times"],
  ["spasi \\quad lebar", "spasi $\\quad$ lebar", "bare \\quad"],
  ["$\\frac{1}{2}$ sudah", "$\\frac{1}{2}$ sudah", "jangan dobel wrap existing $"],
  ["$$\\frac{1}{2}$$", "$$\\frac{1}{2}$$", "jangan sentuh display math"],
];

let gagal = 0;
for (const [input, expected, label] of cases) {
  const got = mathify(input);
  try {
    assert.strictEqual(got, expected);
  } catch {
    gagal++;
    console.error(`✗ ${label}\n  in : ${JSON.stringify(input)}\n  out: ${JSON.stringify(got)}\n  exp: ${JSON.stringify(expected)}`);
  }
}

const total = cases.length;
if (gagal === 0) console.log(`✓ mathify: ${total}/${total} kasus lolos`);
else {
  console.error(`✗ mathify: ${total - gagal}/${total} lolos, ${gagal} gagal`);
  process.exit(1);
}
