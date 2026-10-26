const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Desktop Collapsible Sidebar: Sidebar.tsx memuat props & toggle button untuk collapse rail", () => {
  const sidebarPath = path.join(__dirname, "../src/components/layout/Sidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "src/components/layout/Sidebar.tsx harus ada");

  const content = fs.readFileSync(sidebarPath, "utf-8");

  // Verifikasi props collapse
  assert.match(
    content,
    /isDesktopCollapsed\?: boolean/,
    "SidebarProps harus menyertakan prop isDesktopCollapsed"
  );
  assert.match(
    content,
    /onToggleDesktopCollapse\?: \(\) => void/,
    "SidebarProps harus menyertakan prop onToggleDesktopCollapse"
  );

  // Verifikasi toggle button
  assert.match(
    content,
    /sidebar-collapse-toggle/,
    "Sidebar.tsx harus memiliki tombol toggle berkelas sidebar-collapse-toggle"
  );
  assert.match(
    content,
    /title=\{isDesktopCollapsed \? "Perluas Sidebar" : "Ciutkan Sidebar \(Layar Penuh\)"\}/,
    "Sidebar.tsx harus memiliki title tooltip dinamis untuk perluas / ciutkan"
  );

  // Verifikasi ikon rail & mark box
  assert.match(
    content,
    /side-mark-box/,
    "Sidebar.tsx harus menyertakan mark box untuk icon rail"
  );
  assert.match(
    content,
    /isRail \? "t\." : "t"/,
    "Sidebar.tsx harus menampilkan compact logo mark 't.' di mode collapsed"
  );
});

test("Desktop Collapsible Sidebar: App.tsx mengelola state & localStorage persistence", () => {
  const appPath = path.join(__dirname, "../src/App.tsx");
  assert.ok(fs.existsSync(appPath), "src/App.tsx harus ada");

  const content = fs.readFileSync(appPath, "utf-8");

  // Verifikasi state dan key localStorage
  assert.match(
    content,
    /tanka_desktop_sidebar_collapsed/,
    "App.tsx harus menyimpan state collapsed ke localStorage tanka_desktop_sidebar_collapsed"
  );
  assert.match(
    content,
    /isDesktopCollapsed=\{isDesktopSidebarCollapsed\}/,
    "App.tsx harus meneruskan isDesktopCollapsed ke Sidebar"
  );
  assert.match(
    content,
    /onToggleDesktopCollapse=\{handleToggleDesktopSidebarCollapse\}/,
    "App.tsx harus meneruskan onToggleDesktopCollapse handler ke Sidebar"
  );
});

test("Desktop Collapsible Sidebar: index.css memuat aturan 68px rail & transisi halus", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const content = fs.readFileSync(cssPath, "utf-8");

  // Verifikasi lebar rail 68px di media query desktop
  assert.match(
    content,
    /width:\s*68px\s*!important;/,
    "index.css harus mendefinisikan lebar 68px untuk sidebar collapsed"
  );

  // Verifikasi transisi lebar
  assert.match(
    content,
    /transition: width 0\.22s cubic-bezier/,
    "index.css harus memiliki transisi halus 0.22s untuk perubahan lebar"
  );

  // Verifikasi styling toggle button
  assert.match(
    content,
    /\.sidebar-collapse-toggle/,
    "index.css harus memiliki styling untuk .sidebar-collapse-toggle"
  );
});
