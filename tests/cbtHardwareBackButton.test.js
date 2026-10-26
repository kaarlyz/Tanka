const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Hardware Back: ExamCbtTab mengintegrasikan Virtual History State (pushState & popstate)", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi pushState dengan payload tanka_modal
  assert.match(
    content,
    /window\.history\.pushState\(\s*\{\s*tanka_modal:\s*activeModalId[\s\S]*?Date\.now\(\)\s*\}\s*,\s*["']["']\s*\)/,
    "ExamCbtTab harus memanggil pushState dengan payload tanka_modal saat modal dibuka"
  );

  // 2. Verifikasi popstate listener ditambahkan dan dibersihkan
  assert.match(
    content,
    /window\.addEventListener\(["']popstate["'],\s*handlePopState\)/,
    "ExamCbtTab harus mendaftarkan listener event popstate"
  );
  assert.match(
    content,
    /window\.removeEventListener\(["']popstate["'],\s*handlePopState\)/,
    "ExamCbtTab harus membersihkan listener event popstate pada cleanup effect"
  );

  // 3. Verifikasi handlePopState menutup seluruh varian modal CBT
  assert.match(
    content,
    /if\s*\(\s*zoomImage\s*\)\s*\{\s*setZoomImage\(null\);[\s\S]*?setIsSoalModalOpen\(false\);[\s\S]*?setIsWacanaModalOpen\(false\);[\s\S]*?setIsPaletteOpen\(false\);/,
    "handlePopState harus menutup zoomImage, isSoalModalOpen, isWacanaModalOpen, dan isPaletteOpen"
  );

  // 4. Verifikasi pembersihan history stack saat manual close (window.history.back)
  assert.match(
    content,
    /window\.history\.back\(\)/,
    "ExamCbtTab harus memanggil window.history.back() untuk membersihkan stack saat manual close"
  );
});

test("CBT Hardware Back: useAppRoute mengabaikan event popstate dengan tanka_modal", () => {
  const routeHookPath = path.join(__dirname, "../src/hooks/useAppRoute.ts");
  assert.ok(fs.existsSync(routeHookPath), "useAppRoute.ts harus ada");

  const content = fs.readFileSync(routeHookPath, "utf-8");

  // Verifikasi proteksi tanka_modal pada popstate
  assert.match(
    content,
    /handlePopState\s*=\s*\(\s*e:\s*PopStateEvent\s*\)\s*=>\s*\{[\s\S]*?if\s*\(\s*\(e\.state\s+as\s+any\)\?\.tanka_modal\s*\)\s*return;/,
    "useAppRoute harus memeriksa e.state?.tanka_modal dan mengabaikan navigasi tab"
  );
});

test("CBT Hardware Back: Simulasi Runtime Virtual History State & PopState Navigation", () => {
  // Simulasi mock environment browser window & history
  const historyStack = [{ tab: "cbt" }];
  let currentStateIndex = 0;
  const listeners = { popstate: [] };

  const mockWindow = {
    history: {
      get state() {
        return currentStateIndex >= 0 ? historyStack[currentStateIndex] : null;
      },
      pushState(statePayload, unused) {
        currentStateIndex++;
        historyStack[currentStateIndex] = statePayload;
      },
      back() {
        if (currentStateIndex > 0) {
          currentStateIndex--;
          const event = { state: this.state };
          for (const fn of listeners.popstate) {
            fn(event);
          }
        }
      }
    },
    addEventListener(evt, fn) {
      if (listeners[evt]) listeners[evt].push(fn);
    },
    removeEventListener(evt, fn) {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter((cb) => cb !== fn);
      }
    }
  };

  // State simulasi CBT
  let isSoalModalOpen = false;
  let isWacanaModalOpen = false;
  let isPaletteOpen = false;
  let zoomImage = null;
  let activeTab = "cbt";

  // Mock route popstate listener (sesuai useAppRoute)
  let locationPathname = "/cbt";
  const getTabFromLocation = () => {
    return locationPathname.replace(/^\//, "");
  };
  const routePopHandler = (e) => {
    if (e.state?.tanka_modal) return;
    activeTab = getTabFromLocation();
  };
  mockWindow.addEventListener("popstate", routePopHandler);

  // Uji proteksi eksplisit e.state?.tanka_modal pada useAppRoute
  locationPathname = "/home";
  routePopHandler({ state: { tanka_modal: "soal" } });
  assert.equal(activeTab, "cbt", "routePopHandler harus mengabaikan event jika e.state?.tanka_modal ada");
  locationPathname = "/cbt";

  // 1. Skenario: Buka Modal Soal -> pushState terpanggil
  isSoalModalOpen = true;
  mockWindow.history.pushState({ tanka_modal: "soal", timestamp: Date.now() }, "");
  assert.equal(mockWindow.history.state?.tanka_modal, "soal");
  assert.equal(historyStack.length, 2);

  // Pasang listener popstate CBT
  let popstateTriggered = false;
  const cbtPopHandler = (e) => {
    popstateTriggered = true;
    if (zoomImage) zoomImage = null;
    else if (isSoalModalOpen) isSoalModalOpen = false;
    else if (isWacanaModalOpen) isWacanaModalOpen = false;
    else if (isPaletteOpen) isPaletteOpen = false;
  };
  mockWindow.addEventListener("popstate", cbtPopHandler);

  // 2. Skenario: User tekan Hardware Back Button HP (simulasi history.back)
  // Menembakkan popstate event
  mockWindow.history.back();

  assert.equal(popstateTriggered, true, "Popstate listener harus terpicu");
  assert.equal(isSoalModalOpen, false, "Modal soal harus tertutup setelah tombol Back ditekan");
  assert.equal(activeTab, "cbt", "activeTab tidak boleh berubah saat popstate modal terjadi");

  // Bersihkan listener
  mockWindow.removeEventListener("popstate", cbtPopHandler);

  // 3. Skenario: Buka Modal Wacana -> Tutup manual via klik tombol ✕
  isWacanaModalOpen = true;
  mockWindow.history.pushState({ tanka_modal: "wacana", timestamp: Date.now() }, "");
  assert.equal(mockWindow.history.state?.tanka_modal, "wacana");

  // User klik ✕: state ditutup manual, sistem memanggil history.back untuk membersihkan history stack
  isWacanaModalOpen = false;
  if (mockWindow.history.state?.tanka_modal) {
    mockWindow.history.back();
  }

  assert.equal(isWacanaModalOpen, false, "Modal wacana harus tertutup");
  assert.notEqual(mockWindow.history.state?.tanka_modal, "wacana", "History state tanka_modal harus sudah dibersihkan");
});
