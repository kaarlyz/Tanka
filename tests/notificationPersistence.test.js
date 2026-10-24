const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Notification Persistence: public/sw.js memuat cache v7 dan notificationclick handler", () => {
  const swPath = path.join(__dirname, "../public/sw.js");
  assert.ok(fs.existsSync(swPath), "public/sw.js harus ada");
  const swContent = fs.readFileSync(swPath, "utf-8");

  assert.match(
    swContent,
    /CACHE_NAME\s*=\s*["']tanka-pwa-v7["']/,
    "Cache version harus tanka-pwa-v7"
  );
  assert.match(
    swContent,
    /self\.addEventListener\(["']notificationclick["']/,
    "Service worker harus memiliki listener notificationclick"
  );
  assert.match(
    swContent,
    /event\.notification\.close\(\)/,
    "notificationclick harus memanggil event.notification.close()"
  );
  assert.match(
    swContent,
    /clients\.matchAll/,
    "notificationclick harus memeriksa tab aktif via clients.matchAll"
  );
  assert.match(
    swContent,
    /client\.focus\(\)/,
    "notificationclick harus memfokuskan tab klien jika sudah terbuka"
  );
});

test("Notification Persistence: helper localStorage & pending jobs synchronization", async () => {
  // Setup mock localStorage di environment Node
  const storage = new Map();
  const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  global.window = {
    localStorage: mockLocalStorage
  };

  const notificationModule = await import("../src/utils/notification.ts");
  const {
    PROCESSING_DOCS_KEY,
    getProcessingDocs,
    addProcessingDoc,
    removeProcessingDoc,
    isProcessingDoc
  } = notificationModule;

  assert.equal(PROCESSING_DOCS_KEY, "tanka_processing_docs");
  assert.deepEqual(getProcessingDocs(), []);

  // Tambah dokumen pertama
  addProcessingDoc("doc_101");
  assert.equal(isProcessingDoc("doc_101"), true);
  assert.deepEqual(getProcessingDocs(), ["doc_101"]);

  // Tambah dokumen kedua
  addProcessingDoc("doc_202");
  assert.deepEqual(getProcessingDocs(), ["doc_101", "doc_202"]);

  // Idempotensi / deduplikasi penambahan ID yang sama
  addProcessingDoc("doc_101");
  assert.deepEqual(getProcessingDocs(), ["doc_101", "doc_202"]);

  // Hapus satu dokumen
  removeProcessingDoc("doc_101");
  assert.equal(isProcessingDoc("doc_101"), false);
  assert.deepEqual(getProcessingDocs(), ["doc_202"]);

  // Hapus dokumen terakhir membersihkan key dari localStorage
  removeProcessingDoc("doc_202");
  assert.deepEqual(getProcessingDocs(), []);
  assert.equal(mockLocalStorage.getItem(PROCESSING_DOCS_KEY), null);
});

test("Notification Persistence: requestNotificationPermission dan fallback", async () => {
  const storage = new Map();
  const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  let permissionState = "default";
  class MockNotification {
    static get permission() {
      return permissionState;
    }
    static async requestPermission() {
      permissionState = "granted";
      return "granted";
    }
  }

  global.window = {
    localStorage: mockLocalStorage,
    Notification: MockNotification
  };

  const notificationModule = await import("../src/utils/notification.ts");
  const { requestNotificationPermission } = notificationModule;

  const granted = await requestNotificationPermission();
  assert.equal(granted, true);
  assert.equal(MockNotification.permission, "granted");
});

test("Notification Persistence: sendSystemNotification prioritizes Service Worker over window.Notification", async () => {
  let swNotificationCalled = false;
  let swNotificationTitle = "";
  let swNotificationOptions = null;

  let windowNotificationCalled = false;

  const mockRegistration = {
    showNotification: async (title, opts) => {
      swNotificationCalled = true;
      swNotificationTitle = title;
      swNotificationOptions = opts;
    }
  };

  class MockNotification {
    static get permission() {
      return "granted";
    }
    constructor() {
      windowNotificationCalled = true;
    }
  }

  global.window = {
    Notification: MockNotification,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };

  Object.defineProperty(global, "navigator", {
    value: {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration)
      }
    },
    configurable: true,
    writable: true
  });

  const notificationModule = await import("../src/utils/notification.ts");
  const { sendSystemNotification } = notificationModule;

  await sendSystemNotification("Tanka Test", { body: "Testing SW notification" });

  assert.equal(swNotificationCalled, true, "Harus memanggil registration.showNotification()");
  assert.equal(swNotificationTitle, "Tanka Test");
  assert.equal(swNotificationOptions?.body, "Testing SW notification");
  assert.equal(windowNotificationCalled, false, "Fallback window.Notification tidak boleh dipanggil jika SW siap");
});

test("Notification Persistence: notifyDocumentCompleted formatting & deduplication", async () => {
  const sentNotifications = [];

  const mockRegistration = {
    showNotification: async (title, opts) => {
      sentNotifications.push({ title, ...opts });
    }
  };

  class MockNotification {
    static get permission() {
      return "granted";
    }
  }

  global.window = {
    Notification: MockNotification,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };

  Object.defineProperty(global, "navigator", {
    value: {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration)
      }
    },
    configurable: true,
    writable: true
  });

  const notificationModule = await import("../src/utils/notification.ts");
  const { notifyDocumentCompleted } = notificationModule;

  // 1. Dokumen materi biasa
  await notifyDocumentCompleted({
    id: "doc_materi_1",
    title: "Sosiologi Perubahan Sosial",
    isExamSheet: false
  });

  assert.equal(sentNotifications.length, 1);
  assert.equal(sentNotifications[0].title, "Tanka: Materi Siap Dipelajari!");
  assert.match(sentNotifications[0].body, /selesai diproses dan siap dipelajari/);

  // 2. Lembar ujian dengan butir soal
  await notifyDocumentCompleted({
    id: "doc_exam_2",
    title: "Simulasi TKA Sosiologi",
    is_exam_sheet: true,
    question_count: 25
  });

  assert.equal(sentNotifications.length, 2);
  assert.match(sentNotifications[1].body, /25 butir soal siap dibedah/);

  // 3. Deduplikasi: ID yang sama tidak menembak notifikasi ganda
  await notifyDocumentCompleted({
    id: "doc_exam_2",
    title: "Simulasi TKA Sosiologi",
    is_exam_sheet: true,
    question_count: 25
  });

  assert.equal(sentNotifications.length, 2, "Notifikasi ID berulang harus di-deduplikasi");
});
