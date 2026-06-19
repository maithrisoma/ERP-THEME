import { create } from "zustand";
import type { Tone } from "@/components/ui/primitives";

// Shared mock store so the list and the detail page stay in sync.
export type PStatus = "planning" | "in_progress" | "done";
export type Kind = "project" | "task";
export interface Row { id: string; title: string; owner: string; progress: number; status: PStatus }

export const STATUS_META: Record<PStatus, { label: string; tone: Tone }> = {
  planning: { label: "planning", tone: "amber" },
  in_progress: { label: "in progress", tone: "blue" },
  done: { label: "done", tone: "green" },
};
export const STATUS_OPTS: PStatus[] = ["planning", "in_progress", "done"];
export const OWNERS = ["Carla Estevez", "Noah Park", "Priya Shah", "Liam Carter", "Sara Watson", "Omar Gupta"];

const SEED_PROJECTS: Row[] = [
  { id: "p1", title: "Loyalty Launch 1", owner: "Carla Estevez", progress: 89, status: "done" },
  { id: "p2", title: "Loyalty Launch 2", owner: "Noah Park", progress: 83, status: "done" },
  { id: "p3", title: "Warehouse Automation 7", owner: "Priya Shah", progress: 100, status: "done" },
  { id: "p4", title: "Mobile App 5", owner: "Liam Carter", progress: 72, status: "done" },
  { id: "p5", title: "POS Upgrade 4", owner: "Sara Watson", progress: 18, status: "done" },
  { id: "p6", title: "ERP Rollout 4", owner: "Omar Gupta", progress: 49, status: "done" },
  { id: "p7", title: "Cold Chain 2", owner: "Carla Estevez", progress: 95, status: "done" },
  { id: "p8", title: "Payment Gateway 2", owner: "Sara Watson", progress: 100, status: "done" },
  { id: "p9", title: "Shipping Optimizer 4", owner: "Omar Gupta", progress: 58, status: "done" },
  { id: "p10", title: "ERP Rollout 9", owner: "Noah Park", progress: 1, status: "in_progress" },
  { id: "p11", title: "Warehouse Automation 9", owner: "Priya Shah", progress: 7, status: "in_progress" },
  { id: "p12", title: "Cold Chain 5", owner: "Liam Carter", progress: 77, status: "in_progress" },
  { id: "p13", title: "POS Upgrade 5", owner: "Sara Watson", progress: 62, status: "in_progress" },
  { id: "p14", title: "Inventory Sync 3", owner: "Omar Gupta", progress: 34, status: "in_progress" },
  { id: "p15", title: "Store Refit 2", owner: "Carla Estevez", progress: 45, status: "in_progress" },
  { id: "p16", title: "Fuel Integration 1", owner: "Noah Park", progress: 12, status: "in_progress" },
  { id: "p17", title: "Loyalty Launch 3", owner: "Priya Shah", progress: 0, status: "planning" },
  { id: "p18", title: "Analytics Revamp 1", owner: "Liam Carter", progress: 0, status: "planning" },
];
const SEED_TASKS: Row[] = [
  { id: "t1", title: "Configure POS terminals", owner: "Sara Watson", progress: 80, status: "in_progress" },
  { id: "t2", title: "Migrate customer data", owner: "Noah Park", progress: 100, status: "done" },
  { id: "t3", title: "Test payment flow", owner: "Liam Carter", progress: 45, status: "in_progress" },
  { id: "t4", title: "Write API documentation", owner: "Priya Shah", progress: 30, status: "in_progress" },
  { id: "t5", title: "Set up CI pipeline", owner: "Omar Gupta", progress: 100, status: "done" },
  { id: "t6", title: "Design loyalty emails", owner: "Carla Estevez", progress: 0, status: "planning" },
  { id: "t7", title: "Audit inventory counts", owner: "Noah Park", progress: 65, status: "in_progress" },
  { id: "t8", title: "Train store staff", owner: "Sara Watson", progress: 20, status: "planning" },
  { id: "t9", title: "Review security policy", owner: "Liam Carter", progress: 90, status: "done" },
  { id: "t10", title: "Optimize delivery routes", owner: "Omar Gupta", progress: 55, status: "in_progress" },
];

interface ProjectsStore {
  projects: Row[];
  tasks: Row[];
  add: (kind: Kind, row: Row) => void;
  update: (id: string, patch: Partial<Row>) => void;
  remove: (id: string) => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: SEED_PROJECTS,
  tasks: SEED_TASKS,
  add: (kind, row) => set((s) => (kind === "project" ? { projects: [row, ...s.projects] } : { tasks: [row, ...s.tasks] })),
  update: (id, patch) => set((s) => ({
    projects: s.projects.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    tasks: s.tasks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  })),
  remove: (id) => set((s) => ({ projects: s.projects.filter((r) => r.id !== id), tasks: s.tasks.filter((r) => r.id !== id) })),
}));
