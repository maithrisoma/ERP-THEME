import { money, type Money } from "@/platform/types";

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type ContactStatus = "lead" | "active" | "churned";
export type Channel = "email" | "sms" | "social" | "whatsapp";
export type CampaignStatus = "draft" | "active" | "completed" | "paused";

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  owner: string;
  status: ContactStatus;
  tone: string;
  lastTouch: string;
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  stage: DealStage;
  value: Money;
  owner: string;
  closeDate: string;
  probability: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  status: CampaignStatus;
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  startDate: string;
}

const TONES = ["navy", "teal", "blue", "purple", "green", "amber", "coral"];
const OWNERS = ["Isabella Conti", "Noah Berg", "Amara Diallo"];

const COMPANIES = ["Vertex Foods", "BlueHarbor Retail", "Summit Grocers", "Maple & Co", "Northpoint Mart", "Coastline Markets", "Ironwood Supply", "Evergreen Stores", "Lakeside Goods", "Brightway Retail", "Cedar Pantry", "Harbor Fresh"];

export const contacts: Contact[] = COMPANIES.map((company, i) => ({
  id: `ct_${1000 + i}`,
  name: ["Olivia Hart", "Ethan Cole", "Maya Singh", "Liam Brooks", "Zoe Patel", "Caleb Wynn", "Nora Fox", "Aiden Reyes", "Ivy Chen", "Owen Diaz", "Lena Park", "Theo Marsh"][i],
  company,
  email: `${["olivia", "ethan", "maya", "liam", "zoe", "caleb", "nora", "aiden", "ivy", "owen", "lena", "theo"][i]}@${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
  phone: `+1 (415) 555-${(2000 + i).toString().padStart(4, "0")}`,
  title: ["Procurement Lead", "Owner", "Buyer", "Operations Mgr", "Category Mgr", "Director", "Founder", "GM", "Buyer", "VP Retail", "Owner", "Procurement"][i],
  owner: OWNERS[i % OWNERS.length],
  status: (["lead", "active", "active", "lead", "active", "churned", "active", "lead", "active", "active", "lead", "active"] as ContactStatus[])[i],
  tone: TONES[i % TONES.length],
  lastTouch: `2026-06-${(2 + (i % 9)).toString().padStart(2, "0")}`,
}));

const STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
export const deals: Deal[] = Array.from({ length: 11 }).map((_, i) => ({
  id: `dl_${500 + i}`,
  name: `${COMPANIES[i % COMPANIES.length]} — ${["Annual supply", "POS rollout", "Loyalty add-on", "Multi-store deal", "Renewal", "Pilot program"][i % 6]}`,
  company: COMPANIES[i % COMPANIES.length],
  stage: STAGES[i % 6 === 5 && i % 2 === 0 ? 4 : i % 6],
  value: money([24000, 56000, 18500, 92000, 12000, 41000, 73000, 30000, 15000, 64000, 22000][i]),
  owner: OWNERS[i % OWNERS.length],
  closeDate: `2026-0${7 + (i % 3)}-${(10 + (i % 18)).toString().padStart(2, "0")}`,
  probability: [20, 40, 60, 80, 100, 0][STAGES.indexOf(STAGES[i % 6])],
}));

export const campaigns: Campaign[] = [
  { id: "cm_1", name: "Spring Loyalty Boost", channel: "email", status: "active", audience: 12400, sent: 12400, opened: 5480, clicked: 1620, converted: 312, startDate: "2026-05-20" },
  { id: "cm_2", name: "New Store Launch — Austin", channel: "social", status: "active", audience: 38000, sent: 38000, opened: 9100, clicked: 2740, converted: 184, startDate: "2026-06-01" },
  { id: "cm_3", name: "Win-back: lapsed buyers", channel: "whatsapp", status: "paused", audience: 4200, sent: 2100, opened: 1380, clicked: 410, converted: 96, startDate: "2026-05-12" },
  { id: "cm_4", name: "Fuel rewards SMS", channel: "sms", status: "completed", audience: 8600, sent: 8600, opened: 6900, clicked: 2100, converted: 540, startDate: "2026-04-28" },
  { id: "cm_5", name: "B2B account nurture", channel: "email", status: "draft", audience: 320, sent: 0, opened: 0, clicked: 0, converted: 0, startDate: "2026-06-18" },
];

const WEEK_DATES = ["2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20"];

// ─── Leads ──────────────────────────────────────────────────────────────────
export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified";
export interface Lead {
  id: string; name: string; company: string; email: string; phone: string;
  source: string; status: LeadStatus; owner: string; value: Money; tone: string; createdAt: string;
}
const LEAD_SOURCES = ["Website", "Referral", "Trade show", "Cold call", "LinkedIn", "Webinar"];
const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "unqualified"];
export const leads: Lead[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `ld_${700 + i}`,
  name: ["Riya Shah", "Marcus Webb", "Tara Lin", "Sam Okoro", "Priya Roy", "Dean Vega", "Hana Kim", "Cole Banks", "Mira Sethi", "Jude Frost", "Lana Ortiz", "Niko Adler"][i],
  company: COMPANIES[i % COMPANIES.length],
  email: `lead${i}@${COMPANIES[i % COMPANIES.length].toLowerCase().replace(/[^a-z]/g, "")}.com`,
  phone: `+1 (628) 555-${(3000 + i).toString().padStart(4, "0")}`,
  source: LEAD_SOURCES[i % LEAD_SOURCES.length],
  status: LEAD_STATUSES[i % LEAD_STATUSES.length],
  owner: OWNERS[i % OWNERS.length],
  value: money([8000, 15000, 22000, 5000, 30000, 12000, 18000, 9000, 26000, 7000, 14000, 20000][i]),
  tone: TONES[i % TONES.length],
  createdAt: `2026-06-${(1 + (i % 27)).toString().padStart(2, "0")}`,
}));

// ─── Accounts ───────────────────────────────────────────────────────────────
export type AccountType = "prospect" | "customer" | "partner";
export interface Account {
  id: string; name: string; industry: string; type: AccountType; owner: string;
  website: string; phone: string; employees: number; revenue: Money; tone: string;
}
const INDUSTRIES = ["Grocery", "Convenience", "Specialty retail", "Wholesale", "Pharmacy", "Fuel & C-store"];
const ACCOUNT_TYPES: AccountType[] = ["prospect", "customer", "partner"];
export const accounts: Account[] = COMPANIES.map((name, i) => ({
  id: `ac_${900 + i}`,
  name,
  industry: INDUSTRIES[i % INDUSTRIES.length],
  type: ACCOUNT_TYPES[i % 3],
  owner: OWNERS[i % OWNERS.length],
  website: `${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
  phone: `+1 (415) 555-${(4000 + i).toString().padStart(4, "0")}`,
  employees: [40, 120, 18, 300, 75, 210, 55, 90, 28, 160, 12, 68][i],
  revenue: money([1200000, 4800000, 650000, 9200000, 2100000, 5600000, 1800000, 3400000, 520000, 7100000, 310000, 2600000][i]),
  tone: TONES[i % TONES.length],
}));

// ─── Products (catalog) ──────────────────────────────────────────────────────
export interface Product { id: string; name: string; sku: string; category: string; price: Money; active: boolean; stock: number; }
const PRODUCT_NAMES = ["POS Terminal Pro", "Barcode Scanner", "Loyalty Module", "Receipt Printer", "Self-Checkout Kiosk", "Inventory Sensor", "Cash Drawer", "Card Reader"];
const PRODUCT_PRICES = [1200, 250, 800, 400, 9000, 150, 300, 200];
const PRODUCT_CATS = ["Hardware", "Software", "Accessory", "Service"];
export const products: Product[] = PRODUCT_NAMES.map((name, i) => ({
  id: `pr_${100 + i}`,
  name,
  sku: `SKU-${1000 + i}`,
  category: PRODUCT_CATS[i % PRODUCT_CATS.length],
  price: money(PRODUCT_PRICES[i]),
  active: i % 5 !== 4,
  stock: [120, 540, 9999, 80, 12, 320, 210, 460][i],
}));

// ─── Quotes ─────────────────────────────────────────────────────────────────
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";
export interface QuoteLine { item: string; qty: number; price: number; }
export interface Quote { id: string; number: string; account: string; status: QuoteStatus; owner: string; createdAt: string; validUntil: string; lines: QuoteLine[]; }
const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "declined"];
export const quotes: Quote[] = Array.from({ length: 9 }).map((_, i) => {
  const lines: QuoteLine[] = Array.from({ length: (i % 3) + 1 }).map((__, j) => ({
    item: PRODUCT_NAMES[(i + j) % PRODUCT_NAMES.length], qty: (j + 1) * ((i % 4) + 1), price: PRODUCT_PRICES[(i + j) % PRODUCT_PRICES.length],
  }));
  return {
    id: `qt_${i + 1}`, number: `Q-2026-${1001 + i}`, account: COMPANIES[i % COMPANIES.length], status: QUOTE_STATUSES[i % 4],
    owner: OWNERS[i % OWNERS.length], createdAt: `2026-06-${(2 + i).toString().padStart(2, "0")}`, validUntil: `2026-0${7 + (i % 2)}-${(15 + i).toString().padStart(2, "0")}`, lines,
  };
});
export const quoteTotal = (q: Quote) => q.lines.reduce((s, l) => s + l.qty * l.price, 0);

// ─── Activities: tasks, meetings, calls ──────────────────────────────────────
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskType = "call" | "email" | "follow_up" | "meeting" | "todo";
export interface Task { id: string; subject: string; related: string; due: string; priority: TaskPriority; status: TaskStatus; type: TaskType; owner: string; }
const TASK_SEED: { subject: string; type: TaskType; status: TaskStatus; priority: TaskPriority; day: number }[] = [
  { subject: "Follow up on proposal", type: "follow_up", status: "in_progress", priority: "high", day: 13 },
  { subject: "Send pricing sheet", type: "email", status: "todo", priority: "high", day: 16 },
  { subject: "Schedule product demo", type: "meeting", status: "todo", priority: "medium", day: 17 },
  { subject: "Renewal check-in call", type: "call", status: "in_progress", priority: "high", day: 14 },
  { subject: "Qualify inbound lead", type: "follow_up", status: "done", priority: "medium", day: 11 },
  { subject: "Prepare contract draft", type: "todo", status: "todo", priority: "high", day: 19 },
  { subject: "Quarterly business review", type: "meeting", status: "todo", priority: "medium", day: 23 },
  { subject: "Onboarding kickoff call", type: "call", status: "in_progress", priority: "medium", day: 16 },
  { subject: "Collect customer feedback", type: "email", status: "todo", priority: "low", day: 24 },
  { subject: "Upsell loyalty add-on", type: "follow_up", status: "todo", priority: "low", day: 21 },
  { subject: "Send NDA for signature", type: "email", status: "done", priority: "medium", day: 12 },
  { subject: "Write demo follow-up notes", type: "todo", status: "in_progress", priority: "low", day: 15 },
  { subject: "Confirm budget with finance", type: "call", status: "todo", priority: "high", day: 18 },
  { subject: "Re-engage cold lead", type: "follow_up", status: "todo", priority: "medium", day: 20 },
  { subject: "Close-won handoff to CS", type: "todo", status: "done", priority: "medium", day: 10 },
];
export const tasks: Task[] = TASK_SEED.map((t, i) => ({
  id: `tk_${i + 1}`,
  subject: t.subject,
  related: COMPANIES[i % COMPANIES.length],
  due: `2026-06-${String(t.day).padStart(2, "0")}`,
  priority: t.priority,
  status: t.status,
  type: t.type,
  owner: OWNERS[i % OWNERS.length],
}));

export interface Meeting { id: string; title: string; account: string; date: string; start: string; end: string; location: string; attendees: string[]; owner: string; }
export const meetings: Meeting[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `mt_${i + 1}`,
  title: ["Discovery call", "Solution demo", "Pricing review", "Contract walkthrough", "Quarterly business review", "Kickoff", "Renewal discussion", "Exec alignment"][i],
  account: COMPANIES[i % COMPANIES.length],
  date: WEEK_DATES[i % WEEK_DATES.length],
  start: ["09:00", "10:30", "13:00", "14:30", "11:00", "15:30", "09:30", "16:00"][i],
  end: ["09:30", "11:30", "13:30", "15:00", "12:00", "16:00", "10:00", "16:30"][i],
  location: i % 2 === 0 ? "Google Meet" : "On-site",
  attendees: [contacts[i % contacts.length].name, OWNERS[i % OWNERS.length]],
  owner: OWNERS[i % OWNERS.length],
}));

export type CallDirection = "inbound" | "outbound";
export interface Call { id: string; subject: string; contact: string; date: string; time: string; direction: CallDirection; durationMin: number; status: "scheduled" | "completed"; outcome: string; owner: string; }
export const calls: Call[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `cl_${i + 1}`,
  subject: ["Intro call", "Follow-up", "Demo recap", "Pricing questions", "Renewal", "Support check", "Negotiation", "Onboarding", "Feedback"][i],
  contact: contacts[i % contacts.length].name,
  date: WEEK_DATES[i % WEEK_DATES.length],
  time: ["09:15", "11:00", "13:45", "15:15", "10:00", "16:30", "09:45", "14:00", "12:30"][i],
  direction: (["outbound", "inbound"] as CallDirection[])[i % 2],
  durationMin: [15, 30, 20, 45, 10, 25, 35, 15, 20][i],
  status: i % 3 === 0 ? "scheduled" : "completed",
  outcome: i % 3 === 0 ? "—" : ["Interested", "Left voicemail", "Needs follow-up", "Closed won", "Not a fit"][i % 5],
  owner: OWNERS[i % OWNERS.length],
}));

// ─── Support cases ────────────────────────────────────────────────────────────
export type CaseStatus = "open" | "in_progress" | "resolved" | "closed";
export type CasePriority = "low" | "medium" | "high" | "urgent";
export interface SupportCase { id: string; number: string; subject: string; account: string; priority: CasePriority; status: CaseStatus; owner: string; createdAt: string; }
export const cases: SupportCase[] = Array.from({ length: 9 }).map((_, i) => ({
  id: `cs_${i + 1}`,
  number: `CASE-${2001 + i}`,
  subject: ["POS sync error", "Refund discrepancy", "Login issue", "Hardware RMA", "Report not loading", "Tax setup help", "Integration failure", "Billing question", "Feature request"][i],
  account: COMPANIES[i % COMPANIES.length],
  priority: (["urgent", "high", "medium", "low"] as CasePriority[])[i % 4],
  status: (["open", "in_progress", "resolved", "closed"] as CaseStatus[])[i % 4],
  owner: OWNERS[i % OWNERS.length],
  createdAt: `2026-06-${(5 + i).toString().padStart(2, "0")}`,
}));

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const byId = <T extends { id: string }>(arr: T[], id: string) => arr.find((x) => x.id === id);
