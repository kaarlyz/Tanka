import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw } from "lucide-react";

export interface StudioCockpitProps {
  onActionLaunch: () => void;
}

type Mode = "nara" | "video" | "bank" | "ritme";

const MODES: ReadonlyArray<{ id: Mode; no: string; title: string; blurb: string }> = [
  { id: "nara", no: "01", title: "Tanya Nara", blurb: "Penjelasan langsung ke rumus, langkah demi langkah." },
  { id: "video", no: "02", title: "Pecah Video dan PDF", blurb: "Materi panjang jadi bab pendek dengan perkiraan waktu baca." },
  { id: "bank", no: "03", title: "Bank Soal Salah", blurb: "Soal yang keliru tercatat otomatis untuk diulang." },
  { id: "ritme", no: "04", title: "Ritme Belajar", blurb: "Target mingguan, hari aktif, dan timer fokus." }
];

const QA = [
  { q: "Turunan dari f(x) = x³", steps: ["Aturan pangkat: d/dx xⁿ = n · xⁿ⁻¹.", "Di sini n = 3, jadi f′(x) = 3 · x².", "Hasil akhir: f′(x) = 3x²."] },
  { q: "Kecepatan rata-rata", steps: ["Kecepatan rata-rata = perpindahan ÷ selang waktu.", "Ditulis v̄ = Δs / Δt.", "Contoh: Δs = 100 m dan Δt = 20 s, maka v̄ = 5 m/s."] },
  { q: "Elastisitas harga permintaan", steps: ["Ed = %ΔQ ÷ %ΔP.", "Persentase dihitung terhadap nilai awal.", "Jika |Ed| > 1 permintaan elastis, jika |Ed| < 1 inelastis."] }
] as const;

const CHAPTERS = [
  { t: "Pengantar dan tujuan", m: "2 mnt", s: "Ruang lingkup materi dan istilah yang dipakai." },
  { t: "Konsep inti", m: "4 mnt", s: "Definisi formal dan notasinya." },
  { t: "Contoh soal bertahap", m: "3 mnt", s: "Satu contoh dikerjakan langkah demi langkah." },
  { t: "Ringkasan dan latihan", m: "2 mnt", s: "Poin penting dan soal untuk diulang." }
] as const;

const BANK = [
  { q: "(f∘g)(2) dengan f(x) = 2x + 3 dan g(x) = x²", wrong: "49", right: "11", note: "Urutan komposisi terbalik. Kerjakan g dulu, baru f." },
  { q: "f⁻¹(x) untuk f(x) = 3x − 6", wrong: "(x − 6)/3", right: "(x + 6)/3", note: "Tukar x dan y, lalu selesaikan untuk y." },
  { q: "|Ed| saat harga 10 ke 12 dan jumlah 50 ke 40", wrong: "2", right: "1", note: "Persentase perubahan dihitung terhadap nilai awal." }
] as const;

const DAYS = ["S", "S", "R", "K", "J", "S", "M"] as const;
const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
const reduced = (): boolean => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mmss = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function NaraPane({ onActionLaunch }: { onActionLaunch: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [free, setFree] = useState("");
  const [note, setNote] = useState(false);

  useEffect(() => {
    if (pick === null) return;
    if (reduced()) {
      setShown(QA[pick].steps.length);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => setShown((n) => (n >= QA[pick].steps.length ? n : n + 1)), 650);
    return () => window.clearInterval(id);
  }, [pick]);

  const send = (): void => {
    if (free.trim().length === 0) return;
    setNote(true);
    setPick(null);
  };

  return (
    <div className="cp-pane">
      <div className="cp-chips" role="group" aria-label="Contoh pertanyaan">
        {QA.map((x, i) => (
          <button key={x.q} className={pick === i ? "on" : ""} aria-pressed={pick === i} onClick={() => { setPick(i); setNote(false); }}>{x.q}</button>
        ))}
      </div>
      <div className="cp-chat" aria-live="polite">
        {pick === null && !note && <p className="cp-empty">Pilih satu pertanyaan contoh di atas untuk melihat cara Nara menjelaskan.</p>}
        {pick !== null && (
          <>
            <div className="cp-bubble you">{QA[pick].q}</div>
            <div className="cp-bubble nara">
              <b>Nara</b>
              {QA[pick].steps.slice(0, shown).map((s, i) => <p key={s} className="cp-step"><i>{i + 1}</i>{s}</p>)}
              {shown < QA[pick].steps.length && <span className="cp-dots" aria-label="Nara sedang menulis"><u /><u /><u /></span>}
            </div>
          </>
        )}
        {note && (
          <div className="cp-bubble nara">
            <b>Nara</b>
            <p>Ini cuplikan statis, jadi pertanyaan bebas belum dijawab di sini. Pilih salah satu contoh, atau buka aplikasi untuk bertanya langsung.</p>
            <button className="cp-link" onClick={onActionLaunch}>Buka aplikasi <ArrowRight size={14} /></button>
          </div>
        )}
      </div>
      <div className="cp-input">
        <input value={free} onChange={(e) => setFree(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ketik pertanyaan..." aria-label="Ketik pertanyaan untuk Nara" />
        <button onClick={send} disabled={free.trim().length === 0}>Kirim</button>
      </div>
    </div>
  );
}

function VideoPane() {
  const [url, setUrl] = useState("https://youtube.com/watch?v=contoh-kalkulus");
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const [sel, setSel] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = (): void => {
    if (phase === "busy") return;
    setPhase("busy");
    setSel(0);
    timer.current = window.setTimeout(() => setPhase("done"), reduced() ? 0 : 1100);
  };
  return (
    <div className="cp-pane">
      <div className="cp-input">
        <input value={url} onChange={(e) => { setUrl(e.target.value); setPhase("idle"); }} aria-label="Tautan video contoh" />
        <button onClick={run} disabled={phase === "busy" || url.trim().length === 0} aria-busy={phase === "busy"}>{phase === "busy" ? "Memecah..." : "Pecah jadi bab"}</button>
      </div>
      <div className="cp-bar" aria-hidden="true"><span className={phase} /></div>
      {phase === "idle" && <p className="cp-empty">Tekan tombol untuk melihat contoh hasil pemecahan menjadi bab.</p>}
      {phase === "done" && (
        <div className="cp-split">
          <ul className="cp-chapters" role="listbox" aria-label="Bab hasil contoh">
            {CHAPTERS.map((c, i) => (
              <li key={c.t} style={{ animationDelay: `${i * 90}ms` }}>
                <button role="option" aria-selected={sel === i} className={sel === i ? "on" : ""} onClick={() => setSel(i)}>
                  <b>Bab {i + 1}</b><span>{c.t}</span><em>{c.m}</em>
                </button>
              </li>
            ))}
          </ul>
          <article className="cp-read" key={sel}>
            <small>BAB {sel + 1} · {CHAPTERS[sel].m} BACA</small>
            <h4>{CHAPTERS[sel].t}</h4>
            <p>{CHAPTERS[sel].s}</p>
          </article>
        </div>
      )}
      <p className="cp-demo-note">Simulasi: bab di atas contoh, bukan hasil memproses video sungguhan.</p>
    </div>
  );
}

function BankPane() {
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number): void => setDone((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <div className="cp-pane">
      <div className="cp-progress" role="status"><b>{done.size} dari {BANK.length} sudah dipahami</b><span><i style={{ width: `${(done.size / BANK.length) * 100}%` }} /></span></div>
      <ul className="cp-bank">
        {BANK.map((b, i) => (
          <li key={b.q} className={done.has(i) ? "ok" : ""}>
            <p>{b.q}</p>
            <div><s>{b.wrong}</s><strong>{b.right}</strong></div>
            <small>{b.note}</small>
            <button aria-pressed={done.has(i)} onClick={() => toggle(i)}>{done.has(i) ? <><Check size={14} /> Sudah paham</> : "Tandai sudah paham"}</button>
          </li>
        ))}
      </ul>
      <p className="cp-demo-note">Contoh isi bank soal.</p>
    </div>
  );
}

function RitmePane() {
  const [days, setDays] = useState<readonly boolean[]>([true, true, false, true, false, false, false]);
  const [left, setLeft] = useState(600);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => setLeft((s) => { if (s <= 1) { setRun(false); return 0; } return s - 1; }), 1000);
    return () => window.clearInterval(id);
  }, [run]);
  const active = days.filter(Boolean).length;
  return (
    <div className="cp-pane">
      <div className="cp-week">
        <p><b>{active} dari 7 hari aktif</b> minggu ini. Ketuk hari untuk menandai.</p>
        <div role="group" aria-label="Hari belajar minggu ini">
          {DAYS.map((d, i) => (
            <button key={DAY_NAMES[i]} aria-pressed={days[i]} aria-label={DAY_NAMES[i]} className={days[i] ? "on" : ""} onClick={() => setDays((v) => v.map((x, k) => (k === i ? !x : x)))}>{d}</button>
          ))}
        </div>
      </div>
      <div className="cp-timer">
        <output aria-live="off">{mmss(left)}</output>
        <div>
          <button onClick={() => { if (left === 0) setLeft(600); setRun((r) => !r); }}>{run ? <><Pause size={15} /> Jeda</> : <><Play size={15} /> {left === 0 ? "Ulangi" : "Mulai fokus"}</>}</button>
          <button className="ghost" aria-label="Setel ulang timer" onClick={() => { setRun(false); setLeft(600); }}><RotateCcw size={15} /></button>
        </div>
        {left === 0 && <p role="status">Sesi 10 menit selesai.</p>}
      </div>
      <p className="cp-demo-note">Data minggu ini contoh dan tidak disimpan.</p>
    </div>
  );
}

export function StudioCockpit({ onActionLaunch }: StudioCockpitProps) {
  const [mode, setMode] = useState<Mode>("nara");
  const idx = MODES.findIndex((m) => m.id === mode);
  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const next = MODES[(idx + dir + MODES.length) % MODES.length].id;
    setMode(next);
    document.getElementById(`cp-tab-${next}`)?.focus();
  };

  return (
    <section id="keunggulan" className="cp-section" aria-labelledby="cp-title">
      <div className="cp-head">
        <p className="section-kicker">RUANG BELAJAR</p>
        <h2 id="cp-title">Bukan sekadar baca materi. Ini mesin belajar mandiri.</h2>
        <p>Empat alat dalam satu ruang. Coba langsung cuplikannya di bawah.</p>
      </div>
      <div className="cp-grid">
        <div className="cp-side">
        <div className="cp-tabs" role="tablist" aria-label="Alat belajar" aria-orientation="vertical" onKeyDown={onKey}>
          {MODES.map((m) => (
            <button key={m.id} id={`cp-tab-${m.id}`} role="tab" aria-selected={mode === m.id} aria-controls="cp-panel" tabIndex={mode === m.id ? 0 : -1} className={mode === m.id ? "on" : ""} onClick={() => setMode(m.id)}>
              <i>{m.no}</i><b>{m.title}</b><span>{m.blurb}</span>
            </button>
          ))}
        </div>
          <button className="cp-launch" onClick={onActionLaunch}>Buka aplikasi <ArrowRight size={16} /></button>
        </div>
        <div className="cp-window">
          <div className="cp-chrome">
            <span aria-hidden="true"><u /><u /><u /></span>
            <code>tanka · {MODES[idx].title.toLowerCase()}</code>
            <em>DATA CONTOH</em>
          </div>
          <div className="cp-crumb"><span>Modul</span> / <b>Fungsi dan Turunan</b></div>
          <div id="cp-panel" role="tabpanel" aria-labelledby={`cp-tab-${mode}`} key={mode} className="cp-body">
            {mode === "nara" && <NaraPane onActionLaunch={onActionLaunch} />}
            {mode === "video" && <VideoPane />}
            {mode === "bank" && <BankPane />}
            {mode === "ritme" && <RitmePane />}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudioCockpit;
