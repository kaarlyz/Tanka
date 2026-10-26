const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Header Collision Guard: .cbt-runner-header pada mobile menggunakan background solid 100% opaque tanpa transparansi", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi background solid #18221f (100% opaque, tidak ada ghosting bleed-through)
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?background:\s*#18221f\s*!important;/,
    "Header CBT mobile harus menggunakan background solid #18221f (100% opaque)"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?background-color:\s*#18221f\s*!important;/,
    "Header CBT mobile harus memiliki background-color solid #18221f"
  );

  // Pastikan tidak ada rgba dengan alpha < 1 pada background header mobile
  const headerMobileMatch = css.match(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.cbt-runner-header\s*\{([^}]+)\}/);
  assert.ok(headerMobileMatch, "Blok .cbt-runner-header pada media query mobile harus ditemukan");
  const headerRules = headerMobileMatch[1];
  assert.doesNotMatch(
    headerRules,
    /background(?:-color)?:\s*rgba\([^)]+,\s*0?\.[0-9]+\)/,
    "Header CBT mobile tidak boleh menggunakan background transparan/semi-transparan"
  );
});

test("CBT Header Collision Guard: Memiliki garis pembatas tegas border-bottom dan box-shadow elevasi", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi border-bottom tegas (visual shelf divider)
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?border-bottom:\s*2px\s*solid\s*rgba\(200,\s*240,\s*100,\s*0\.4\)\s*!important;/,
    "Header CBT mobile harus memiliki border-bottom: 2px solid rgba(200, 240, 100, 0.4) sebagai pembatas visual"
  );

  // 2. Verifikasi box-shadow elevasi penutup
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?box-shadow:\s*0\s+6px\s+20px\s+rgba\(0,\s*0,\s*0,\s*0\.22\)\s*!important;/,
    "Header CBT mobile harus memiliki box-shadow elevasi 0 6px 20px rgba(0, 0, 0, 0.22)"
  );

  // 3. Verifikasi border-radius tepi bawah membulat
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?border-radius:\s*0\s+0\s+14px\s+14px\s*!important;/,
    "Header CBT mobile harus memiliki border-radius: 0 0 14px 14px"
  );
});

test("CBT Header Collision Guard: Posisi sticky mengkompensasi padding container dan menempel rapat tanpa celah", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi posisi sticky dan top pinning kompensasi
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?position:\s*sticky\s*!important;[\s\S]*?top:\s*-14px\s*!important;/,
    "Header CBT mobile harus sticky dengan top: -14px !important untuk mengkompensasi padding .content-scroll"
  );

  // 2. Verifikasi margin kompensasi dan lebar calc(100% + 28px)
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?margin-top:\s*-14px\s*!important;[\s\S]*?margin-left:\s*-14px\s*!important;[\s\S]*?margin-right:\s*-14px\s*!important;[\s\S]*?width:\s*calc\(100%\s*\+\s*28px\)\s*!important;/,
    "Header CBT mobile harus memiliki margin -14px dan lebar calc(100% + 28px) agar menempel rapat penuh ke tepi kanvas"
  );

  // 3. Verifikasi z-index tinggi agar berada di atas lembar soal
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?z-index:\s*120\s*!important;/,
    "Header CBT mobile harus memiliki z-index: 120 !important"
  );

  // 4. Verifikasi kompensasi margin-top 14px pada .cbt-pane
  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?margin-top:\s*14px\s*!important;/,
    "Kartu soal .cbt-pane harus memiliki margin-top: 14px !important sebagai jarak nafas di bawah header"
  );
});
