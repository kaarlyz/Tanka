const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Bottom Nav Stack: MobileBottomNav tetap dirender pada DOM saat CBT runner aktif", () => {
  const appPath = path.join(__dirname, "../src/App.tsx");
  assert.ok(fs.existsSync(appPath), "App.tsx harus ada");

  const content = fs.readFileSync(appPath, "utf-8");

  // Pastikan tidak ada pengecekan negasi {!isCbtRunning && <MobileBottomNav
  assert.doesNotMatch(
    content,
    /\{!isCbtRunning\s*&&\s*\(\s*<MobileBottomNav/,
    "App.tsx tidak boleh menyembunyikan MobileBottomNav saat CBT running (!isCbtRunning && <MobileBottomNav)"
  );

  // Pastikan MobileBottomNav dirender secara konsisten
  assert.match(
    content,
    /<MobileBottomNav[\s\S]*?activeTab=\{activeTab\}/,
    "App.tsx harus merender MobileBottomNav secara permanen di mobile"
  );
});

test("CBT Bottom Nav Stack: Navigasi keluar dari CBT memicu proteksi konfirmasi sesi aktif", () => {
  const appPath = path.join(__dirname, "../src/App.tsx");
  const content = fs.readFileSync(appPath, "utf-8");

  // Verifikasi handler setActiveTab pada MobileBottomNav memproteksi perpindahan tab saat CBT berlangsung
  assert.match(
    content,
    /setActiveTab=\{\(newTab\)\s*=>\s*\{[\s\S]*?if\s*\(activeTab\s*===\s*["']cbt["']\s*&&\s*isCbtRunning\s*&&\s*newTab\s*!==\s*["']cbt["']\)\s*\{[\s\S]*?window\.confirm\(/,
    "setActiveTab pada MobileBottomNav harus memicu window.confirm saat berpindah tab dari CBT aktif"
  );
  assert.match(
    content,
    /Ujian sedang berlangsung\. Yakin ingin meninggalkan sesi latihan\? Progres jawaban tetap tersimpan di sesi ini\./,
    "Pesan konfirmasi pencegah kehilangan data harus sesuai spesifikasi"
  );
});

test("CBT Bottom Nav Stack: Posisi cbt-action-footer berada di atas MobileBottomNav dan container memiliki padding aman", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. MobileBottomNav di paling bawah (bottom: 0, z-index: 2000, height: 58px)
  assert.match(
    css,
    /\.mobile-bottom-nav\s*\{[\s\S]*?position:\s*fixed\s*!important;[\s\S]*?bottom:\s*0\s*!important;[\s\S]*?z-index:\s*2000\s*!important;/,
    ".mobile-bottom-nav harus fixed di bottom: 0 dengan z-index: 2000"
  );

  // 2. cbt-action-footer melayang tepat di atas MobileBottomNav (bottom: calc(66px + ...))
  assert.match(
    css,
    /\.cbt-action-footer\s*\{[\s\S]*?position:\s*fixed\s*!important;[\s\S]*?bottom:\s*calc\(66px\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)\s*!important;[\s\S]*?z-index:\s*1500\s*!important;/,
    ".cbt-action-footer harus fixed di bottom: calc(66px + safe-area) dengan z-index: 1500"
  );

  // 3. cbt-runner-container padding bottom calc(140px + ...) agar opsi jawaban tidak tertutup dock ganda
  assert.match(
    css,
    /\.cbt-runner-container\s*\{[\s\S]*?padding-bottom:\s*calc\(140px\s*\+\s*env\(safe-area-inset-bottom,\s*20px\)\)\s*!important;/,
    ".cbt-runner-container harus memiliki padding-bottom calc(140px + safe-area) di mobile"
  );
});
