export function getSubjectBadge(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("sosiologi") || t.includes("sosial") || t.includes("masyarakat") || t.includes("konflik") || t.includes("perubahan")) {
    return { label: "Sosiologi", color: "#566b36", bg: "#edf4e3", border: "#d7e5c5" };
  }
  if (t.includes("ekonomi") || t.includes("pasar") || t.includes("harga") || t.includes("uang") || t.includes("permintaan") || t.includes("elastisitas") || t.includes("perdagangan")) {
    return { label: "Ekonomi", color: "#7c5545", bg: "#f7eee8", border: "#ebd7cd" };
  }
  if (t.includes("matematika") || t.includes("aljabar") || t.includes("matriks") || t.includes("hitung") || t.includes("fungsi") || t.includes("persamaan") || t.includes("trigonometri") || t.includes("kalkulus") || t.includes("geometri")) {
    return { label: "Matematika", color: "#284439", bg: "#e6ede9", border: "#c5d6cc" };
  }
  if (t.includes("indonesia") || t.includes("inggris") || t.includes("bahasa") || t.includes("paragraf") || t.includes("teks") || t.includes("literasi")) {
    return { label: "Bahasa", color: "#455668", bg: "#e9edf3", border: "#cbd5e1" };
  }
  return { label: "Umum", color: "#4a5550", bg: "#edf1ee", border: "#d8dedb" };
}
