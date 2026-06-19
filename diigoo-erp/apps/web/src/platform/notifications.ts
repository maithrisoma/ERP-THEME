import { create } from "zustand";

/**
 * Cross-user notification feed. Unlike the Topbar's static per-role samples,
 * these are addressed to a specific recipient (by employeeId) and pushed at
 * runtime — e.g. when a recruiter assigns an interviewer. Persisted to
 * localStorage so the recipient sees them the next time they sign in (same
 * browser; a real deployment would persist server-side).
 */
export interface PushedNotif {
  id: string;
  to: string; // recipient employeeId
  iconKey: string; // resolved to a Lucide icon in the Topbar
  tone: string;
  title: string;
  body: string;
  href?: string;
  createdAt: number; // epoch ms — for ordering + relative time
  read: boolean;
}

type PushInput = Omit<PushedNotif, "id" | "read" | "createdAt"> & { id?: string; createdAt?: number };

const LS_KEY = "diigoo-notifs-v1";

function load(): PushedNotif[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as PushedNotif[];
  } catch {
    return [];
  }
}
function persist(items: PushedNotif[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / disabled storage */
  }
}

interface NotifStore {
  items: PushedNotif[];
  /** Add a new notification (auto id, unread, stamped now). */
  push: (n: PushInput) => void;
  /** Add only if an item with this id does not already exist (idempotent seeding). */
  ensure: (n: PushInput & { id: string }) => void;
  markRead: (id: string) => void;
  markAllReadFor: (to: string) => void;
}

let seq = 0;

export const useNotifications = create<NotifStore>((set, get) => ({
  items: load(),
  push: (n) => {
    const item: PushedNotif = {
      id: n.id ?? `ntf_${Date.now()}_${seq++}`,
      read: false,
      createdAt: n.createdAt ?? Date.now(),
      ...n,
    };
    const items = [item, ...get().items.filter((i) => i.id !== item.id)].slice(0, 80);
    persist(items);
    set({ items });
  },
  ensure: (n) => {
    if (get().items.some((i) => i.id === n.id)) return;
    get().push(n);
  },
  markRead: (id) => {
    const items = get().items.map((i) => (i.id === id ? { ...i, read: true } : i));
    persist(items);
    set({ items });
  },
  markAllReadFor: (to) => {
    const items = get().items.map((i) => (i.to === to ? { ...i, read: true } : i));
    persist(items);
    set({ items });
  },
}));
