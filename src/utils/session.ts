/**
 * Session & Device Isolation Utility
 * Guarantees that every unique device or logged-in user maintains a separate sandbox
 * for AI Chat, Mistakes Notebook, and Study metrics, preventing multi-device session bleed.
 */

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "anon";
  const KEY = "tanka_device_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function getEffectiveUserId(currentUser?: { id?: string } | null): string {
  return (currentUser && currentUser.id) ? currentUser.id : getOrCreateDeviceId();
}
