export interface LandingFooterProps {
  onActionLaunch: () => void;
}

const COLS = [
  { h: "Jelajahi", links: [["Tanya Nara", "#tanya-nara"], ["Cara Kerja", "#alur"], ["Peta Konsep", "#peta-konsep"], ["Bedah Soal", "#bedah-soal"]] },
  { h: "Pelajari", links: [["Keunggulan", "#keunggulan"], ["Bongkar Rumus", "#bongkar-rumus"], ["Bandingkan", "#perbandingan"], ["Untuk Siapa", "#testimoni"]] }
] as const;

export function LandingFooter({ onActionLaunch }: LandingFooterProps) {
  return (
    <footer className="ft">
      <div className="ft-grid">
        <div className="ft-brand">
          <button className="ft-logo" onClick={onActionLaunch} aria-label="Buka aplikasi Tanka"><span>t</span>tanka.</button>
          <p>Platform belajar mandiri dengan tutor Nara. Ubah materi apapun jadi langsung bisa dipahami.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <h2>{c.h}</h2>
            <ul>{c.links.map(([t, h]) => <li key={h}><a href={h}>{t}</a></li>)}</ul>
          </nav>
        ))}
        <div>
          <h2>Prinsip</h2>
          <ul className="ft-plain">
            <li>Bebas iklan</li>
            <li>Penjelasan literal, tanpa analogi</li>
            <li>Dapat dibaca offline sebagai PWA</li>
          </ul>
        </div>
      </div>
      <div className="ft-bar">
        <span>© 2026 Tanka. Dirancang dan dibangun oleh Eka Restu Syahputra.</span>
        <a href="#atas">Kembali ke atas ↑</a>
      </div>
    </footer>
  );
}

export default LandingFooter;
