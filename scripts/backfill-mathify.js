// Backfill: jalankan mathify() ke isi yang sudah tersimpan sebelum gerbang ini ada.
// Aman dijalankan berkali-kali (idempoten): potongan yang sudah dibungkus $ tidak disentuh.
//
// Pakai: node scripts/backfill-mathify.js [--dry]
const { db } = require("../server/db");
const { mathify } = require("../server/utils/mathify");

const dry = process.argv.includes("--dry");

const docs = db.prepare("SELECT id, content, summary FROM documents").all();
let docHit = 0;
for (const d of docs) {
  const nextContent = mathify(d.content || "");
  const nextSummary = mathify(d.summary || "");
  if (nextContent === d.content && nextSummary === d.summary) continue;
  docHit++;
  if (!dry) {
    db.prepare("UPDATE documents SET content = ?, summary = ? WHERE id = ?").run(nextContent, nextSummary, d.id);
  }
}

const quizzes = db.prepare("SELECT id, questions FROM quizzes").all();
let quizHit = 0;
for (const q of quizzes) {
  let list;
  try {
    list = JSON.parse(q.questions);
  } catch {
    continue;
  }
  if (!Array.isArray(list)) continue;

  let changed = false;
  for (const item of list) {
    for (const field of ["question", "explanation", "formula", "pitfall", "trik_cepat"]) {
      if (typeof item[field] === "string") {
        const next = mathify(item[field]);
        if (next !== item[field]) {
          item[field] = next;
          changed = true;
        }
      }
    }
    if (item.analisis_opsi && typeof item.analisis_opsi === "object") {
      for (const k of Object.keys(item.analisis_opsi)) {
        if (typeof item.analisis_opsi[k] === "string") {
          const next = mathify(item.analisis_opsi[k]);
          if (next !== item.analisis_opsi[k]) {
            item.analisis_opsi[k] = next;
            changed = true;
          }
        }
      }
    }
    if (Array.isArray(item.options)) {
      item.options = item.options.map((o) => (typeof o === "string" ? mathify(o) : o));
    }
  }

  if (!changed) continue;
  quizHit++;
  if (!dry) db.prepare("UPDATE quizzes SET questions = ? WHERE id = ?").run(JSON.stringify(list), q.id);
}

console.log(`${dry ? "[dry] " : ""}dokumen diubah: ${docHit}/${docs.length} · quiz diubah: ${quizHit}/${quizzes.length}`);
