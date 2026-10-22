// Gerbang tunggal: semua markdown hasil AI lewat sini sebelum disimpan.
// Tugasnya cuma satu — kasih penanda $...$ pada token rumus yang ditulis polos,
// supaya renderer (remark-math / MathView) tidak perlu menebak.
//
// Yang dianggap rumus: token bertanda pangkat atau subskrip, mis. a^m, 2^5, 2^{5+3}, U_n.
// Selain itu dibiarkan apa adanya — sengaja konservatif, salah tandai lebih mahal
// daripada tidak menandai.

/**
 * @param {string} markdown
 * @returns {string} markdown dengan token rumus dibungkus $...$
 */
function mathify(markdown) {
  if (!markdown || typeof markdown !== "string") return markdown;

  // Potong per blok kode / inline code / math yang sudah ada / tag penanda [salah_hitung].
  // Hanya potongan "teks bebas" yang disentuh, biar kode tidak ikut diubah dan $...$ yang
  // sudah benar tidak dobel.
  const parts = markdown.split(/(```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\[[A-Za-z][A-Za-z0-9 _-]{0,39}\])/g);

  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // delimiter hasil split → biarkan
      // a^(m + n) -> a^{m + n}. KaTeX tidak menerima pangkat dalam kurung biasa.
      let normalized = part.replace(/\^(\([^)]{1,30}\))/g, (_, inner) => `^{${inner.slice(1, -1).trim()}}`);
      // Pangkat: a^m, 2^5, a^{m+n}. Basis dibatasi 6 char, ditolak kalau nempel identifier/URL.
      normalized = normalized.replace(
        /(?<![A-Za-z0-9$\\/:])([A-Za-z0-9Δ]{1,6})\^(\{[^}]{1,30}\}|[A-Za-z0-9]{1,4})(?![A-Za-z0-9_])/g,
        (_, base, exp) => `$${base}^${exp}$`
      );
      // Subskrip: U_n, x_1, H_2O. Eksponen wajib angka pendek atau satu huruf.
      normalized = normalized.replace(
        /(?<![A-Za-z0-9$\\/:])([A-Za-zΔ]{1,3})_(\d{1,4}|[A-Za-z])(?![a-z0-9_])/g,
        (_, base, sub) => `$${base}_${sub}$`
      );
      // Bare LaTeX commands without $ delimiters: \frac{}{}, \sqrt{}, \quad, \dots, \times, \text{}, \cdot, \le, \ge, \neq
      // Wrap the whole run in $...$. E.g. "\frac{3}{4}" → "$\frac{3}{4}$"
      normalized = normalized.replace(
        /(?<!\$)\\(frac|sqrt|quad|dots|times|cdot|text|le|ge|neq|pm|mp|div|sum|prod|infty|mathbb|alpha|beta|gamma|delta|theta|pi|in|subset|cup|cap|to|rightarrow|leftarrow|Rightarrow|Leftarrow|approx|equiv|forall|exists|Delta)\b(\{[^}]*\})*(?:[\s]*(\{[^}]*\}))*(?!\$)/g,
        (m) => `$${m.trim()}$`
      );
      return normalized;
    })
    .join("");
}

module.exports = { mathify };
