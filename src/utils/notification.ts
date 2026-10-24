export const PROCESSING_DOCS_KEY = "tanka_processing_docs";

export function getProcessingDocs(): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(PROCESSING_DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && Boolean(id)) : [];
  } catch {
    return [];
  }
}

export function addProcessingDoc(id: string): void {
  if (typeof window === "undefined" || !window.localStorage || !id) return;
  try {
    const docs = getProcessingDocs();
    if (!docs.includes(id)) {
      docs.push(id);
      window.localStorage.setItem(PROCESSING_DOCS_KEY, JSON.stringify(docs));
    }
  } catch {}
}

export function removeProcessingDoc(id: string): void {
  if (typeof window === "undefined" || !window.localStorage || !id) return;
  try {
    const docs = getProcessingDocs().filter((d) => d !== id);
    if (docs.length === 0) {
      window.localStorage.removeItem(PROCESSING_DOCS_KEY);
    } else {
      window.localStorage.setItem(PROCESSING_DOCS_KEY, JSON.stringify(docs));
    }
  } catch {}
}

export function isProcessingDoc(id: string): boolean {
  if (!id) return false;
  return getProcessingDocs().includes(id);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    if (window.Notification.permission === "granted") {
      return true;
    }
    if (window.Notification.permission === "denied") {
      return false;
    }
    const result = await window.Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export interface SystemNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  badge?: string;
  vibrate?: number[];
  renotify?: boolean;
}

export async function sendSystemNotification(
  title: string,
  options: SystemNotificationOptions = {}
): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (window.Notification.permission !== "granted") {
    return;
  }

  const notificationOptions: SystemNotificationOptions = {
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    ...options
  };

  // Prioritas 1: Service Worker registration (krusial di PWA mobile saat tab di background)
  const nav = (typeof window !== "undefined" && (window as any).navigator) || (typeof navigator !== "undefined" ? navigator : undefined);
  if (nav && "serviceWorker" in nav && nav.serviceWorker) {
    try {
      const registration = await nav.serviceWorker.ready;
      if (registration && typeof registration.showNotification === "function") {
        await registration.showNotification(title, notificationOptions as NotificationOptions);
        return;
      }
    } catch (e) {
      console.warn("ServiceWorker showNotification gagal, fallback ke window.Notification:", e);
    }
  }

  // Fallback: new Notification()
  if (typeof window.Notification === "function") {
    try {
      const notif = new window.Notification(title, notificationOptions as NotificationOptions);
      if (options.data?.url && typeof window !== "undefined") {
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    } catch (e) {
      console.warn("Gagal menampilkan Notification fallback:", e);
    }
  }
}

const notifiedCompletedDocs = new Set<string>();

export async function notifyDocumentCompleted(doc: {
  id?: string;
  title?: string;
  question_count?: number;
  questionCount?: number;
  is_exam_sheet?: boolean;
  isExamSheet?: boolean;
}): Promise<void> {
  if (!doc) return;
  if (doc.id && notifiedCompletedDocs.has(doc.id)) {
    return;
  }
  if (doc.id) {
    notifiedCompletedDocs.add(doc.id);
  }

  const title = "Tanka: Materi Siap Dipelajari!";
  const qCount = doc.question_count ?? doc.questionCount ?? 0;
  const isExam = Boolean(doc.is_exam_sheet || doc.isExamSheet || qCount > 0);
  const docTitle = doc.title || "Dokumen";

  const body = isExam
    ? `"${docTitle}" selesai diproses (${qCount} butir soal siap dibedah).`
    : `"${docTitle}" selesai diproses dan siap dipelajari.`;

  await sendSystemNotification(title, {
    body,
    icon: "/icon-192.png",
    tag: doc.id ? `tanka_doc_${doc.id}` : undefined,
    data: {
      url: doc.id ? `/?id=${doc.id}` : "/"
    }
  });
}
