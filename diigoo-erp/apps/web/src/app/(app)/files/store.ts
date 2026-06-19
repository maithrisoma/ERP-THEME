import { create } from "zustand";
import type { Tone } from "@/components/ui/primitives";

export type DStatus = "draft" | "review" | "published" | "archived";
export interface Doc { id: string; title: string; owner: string; status: DStatus }

export const STATUS_META: Record<DStatus, { label: string; tone: Tone }> = {
  draft: { label: "draft", tone: "gray" },
  review: { label: "review", tone: "amber" },
  published: { label: "published", tone: "green" },
  archived: { label: "archived", tone: "navy" },
};
export const STATUS_OPTS: DStatus[] = ["draft", "review", "published", "archived"];
export const TYPES = ["Policy", "Memo", "SOP", "Contract", "Report", "Handbook", "Guide"];
export const DEPTS = ["Retail", "IT", "Finance", "HR", "Operations", "Legal"];

const SEED: Doc[] = [
  { id: "d1", title: "Policy — Retail", owner: "Noah Park", status: "archived" },
  { id: "d2", title: "Memo — IT", owner: "Stella Lee", status: "archived" },
  { id: "d3", title: "Memo — Finance", owner: "Leo Joshi", status: "archived" },
  { id: "d4", title: "SOP — HR", owner: "Ethan Das", status: "draft" },
  { id: "d5", title: "Contract — Finance", owner: "Ravi Singh", status: "draft" },
  { id: "d6", title: "Report — HR", owner: "Lucy Reyes", status: "draft" },
  { id: "d7", title: "Policy — IT", owner: "Sam Reyes", status: "draft" },
  { id: "d8", title: "Memo — IT", owner: "Priya Gupta", status: "draft" },
  { id: "d9", title: "Memo — HR", owner: "Noah Park", status: "draft" },
  { id: "d10", title: "Handbook — IT", owner: "Priya Park", status: "draft" },
  { id: "d11", title: "Memo — Finance", owner: "Ravi Verma", status: "draft" },
  { id: "d12", title: "SOP — Operations", owner: "Sara Watson", status: "review" },
  { id: "d13", title: "Contract — Legal", owner: "Omar Gupta", status: "review" },
  { id: "d14", title: "Guide — Retail", owner: "Liam Carter", status: "review" },
  { id: "d15", title: "Policy — Operations", owner: "Carla Estevez", status: "published" },
  { id: "d16", title: "Report — Finance", owner: "Leo Joshi", status: "published" },
];

interface FilesStore {
  docs: Doc[];
  add: (doc: Doc) => void;
  update: (id: string, patch: Partial<Doc>) => void;
  remove: (id: string) => void;
}

export const useFiles = create<FilesStore>((set) => ({
  docs: SEED,
  add: (doc) => set((s) => ({ docs: [doc, ...s.docs] })),
  update: (id, patch) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  remove: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
}));
