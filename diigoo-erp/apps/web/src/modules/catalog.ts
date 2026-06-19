/**
 * Module catalog — the remaining business modules from the architecture doc
 * (everything except the fully-built HR and Sales & CRM modules). Each is a
 * lightweight manifest so it appears in the sidebar's module switcher for any
 * role whose RBAC grants access, plus an overview page whose capabilities are
 * each clickable for details.
 */
import {
  ShoppingCart, Boxes, ClipboardList, Landmark, Ticket, Fuel, Gift, Truck,
  Mail, PackageCheck, CreditCard, Sparkles, ServerCog, LayoutDashboard, type LucideIcon,
} from "@/components/icon/lucide";
import type { ModuleManifest } from "@/platform/modules";
import type { ModuleKey } from "@/platform/rbac";

export interface Capability {
  name: string;
  detail: string;
}

interface CatalogEntry {
  key: ModuleKey;
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
  basePath: string;
  description: string;
  features: Capability[];
  links?: { label: string; href: string }[];
}

const ENTRIES: CatalogEntry[] = [
  {
    key: "pos", name: "Point of Sale", tagline: "Offline-capable checkout", icon: ShoppingCart, accent: "blue", basePath: "/pos",
    description: "Fast, offline-capable checkout with barcode scanning and split tender across every register.",
    features: [
      { name: "Offline-capable terminal", detail: "Keep ringing up sales even when the internet drops — transactions queue locally in SQLite and sync automatically once you're back online." },
      { name: "Barcode scanning & lookup", detail: "Scan or search any product by barcode, SKU or name for instant price and stock lookup at the register." },
      { name: "Split & multi-tender payment", detail: "Accept a single sale across multiple methods — cash, card, wallet and store credit — in one checkout." },
      { name: "Receipts, refunds & voids", detail: "Print or email receipts and process refunds, exchanges and line voids with a full audit trail." },
    ],
  },
  {
    key: "inventory", name: "Inventory", tagline: "Stock, lots & AI reorder", icon: Boxes, accent: "teal", basePath: "/inventory",
    description: "Multi-location stock control with serial/lot traceability and AI-driven reorder points.",
    features: [
      { name: "FIFO / FEFO costing", detail: "Value stock and pick batches by first-in-first-out or first-expiry-first-out to control cost and reduce waste." },
      { name: "Serial & lot tracking", detail: "Track individual serial numbers and lot/batch codes end-to-end for recalls, warranties and compliance." },
      { name: "Multi-location stock", detail: "See and move stock across every store and warehouse with per-location reorder rules." },
      { name: "AI-driven reorder points", detail: "Forecast demand and auto-suggest reorder quantities so you never stock out or over-order." },
    ],
  },
  {
    key: "purchasing", name: "Purchasing", tagline: "RFQ, POs & 3-way match", icon: ClipboardList, accent: "amber", basePath: "/purchasing",
    description: "Source, approve and reconcile purchase orders with a supplier portal and 3-way match.",
    features: [
      { name: "RFQ & supplier quotes", detail: "Send requests for quotation to multiple suppliers and compare pricing and lead times side by side." },
      { name: "PO approval workflow", detail: "Route purchase orders through configurable approval thresholds before they're issued." },
      { name: "3-way match", detail: "Automatically match the purchase order, goods receipt and supplier invoice before any payment is released." },
      { name: "Supplier portal", detail: "Give suppliers self-service to confirm orders, upload invoices and track payment status." },
    ],
  },
  {
    key: "finance", name: "Finance", tagline: "Ledger, AP/AR & tax", icon: Landmark, accent: "green", basePath: "/finance",
    description: "Double-entry general ledger with AP/AR, multi-currency and tax compliance.",
    features: [
      { name: "Double-entry general ledger", detail: "Every transaction posts to a balanced double-entry ledger with full drill-down to its source document." },
      { name: "Accounts payable & receivable", detail: "Manage what you owe and what you're owed with aging, reminders and reconciliation." },
      { name: "Multi-currency", detail: "Transact, revalue and report across currencies with automatic exchange-rate handling." },
      { name: "Tax & compliance", detail: "Configure tax rules per jurisdiction and generate filing-ready reports." },
    ],
  },
  {
    key: "lottery", name: "Lottery", tagline: "Books, settlement & commission", icon: Ticket, accent: "coral", basePath: "/lottery",
    description: "Activate books, reconcile daily sales and track commission with full regulatory compliance.",
    features: [
      { name: "Book activation & settlement", detail: "Activate ticket books, track scratch and online sales, and settle returns by shift." },
      { name: "Daily reconciliation", detail: "Reconcile lottery sales against the terminal and cash drawer every day." },
      { name: "Commission tracking", detail: "Calculate and report retailer commission automatically across games." },
      { name: "Regulatory compliance", detail: "Stay aligned with state lottery reporting, payout limits and audit rules." },
    ],
  },
  {
    key: "gas_station", name: "Gas Station", tagline: "Forecourt & wet stock", icon: Fuel, accent: "amber", basePath: "/gas-station",
    description: "Forecourt pump control with ATG wet-stock monitoring and fuel/fleet card support.",
    features: [
      { name: "Forecourt pump control", detail: "Authorize, monitor and reconcile every pump from a single console." },
      { name: "ATG wet-stock monitoring", detail: "Read automatic tank gauges to track fuel levels, deliveries and variance/loss." },
      { name: "Fuel & fleet cards", detail: "Accept fuel and fleet cards with per-card limits and consolidated reporting." },
      { name: "Shift reconciliation", detail: "Close each shift with pump, tank and cash reconciliation in one step." },
    ],
  },
  {
    key: "loyalty", name: "Loyalty", tagline: "Points, tiers & campaigns", icon: Gift, accent: "purple", basePath: "/loyalty",
    description: "Reward members with points and tiers, run targeted campaigns and fuel rewards.",
    features: [
      { name: "Points & tiers", detail: "Reward customers with points and tier benefits that update in real time at checkout." },
      { name: "Targeted campaigns", detail: "Build segments and run targeted offers across email, SMS and the app." },
      { name: "Fuel rewards", detail: "Offer cents-per-gallon fuel discounts tied to loyalty spend." },
      { name: "Member segments", detail: "Group members by behaviour and value for precise, automated targeting." },
    ],
  },
  {
    key: "delivery", name: "Delivery", tagline: "Orders, tracking & route AI", icon: Truck, accent: "orange", basePath: "/delivery",
    description: "Aggregate orders across channels, track drivers live and optimize routes with AI.",
    features: [
      { name: "Multi-channel order aggregation", detail: "Pull orders from your storefront and marketplaces into one dispatch queue." },
      { name: "Live driver tracking", detail: "Track drivers on a live map with ETAs shared automatically to customers." },
      { name: "Proof of delivery (POD)", detail: "Capture signatures, photos and timestamps at the doorstep." },
      { name: "AI route optimization", detail: "Auto-sequence stops for the fastest, lowest-cost delivery routes." },
    ],
  },
  {
    key: "comms", name: "Email & Comms", tagline: "Email, WhatsApp & automation", icon: Mail, accent: "blue", basePath: "/comms",
    description: "Transactional and marketing messaging across email, WhatsApp and SMS with automation.",
    features: [
      { name: "Transactional email", detail: "Send reliable transactional email on your own WildDuck/ZoneMTA stack with delivery tracking." },
      { name: "Marketing automation", detail: "Trigger journeys and drip campaigns from customer events and segments." },
      { name: "WhatsApp & SMS", detail: "Reach customers on WhatsApp and SMS with templated, opt-in messaging." },
      { name: "Templates & journeys", detail: "Design reusable templates and multi-step journeys with a visual builder." },
    ],
  },
  {
    key: "shipping", name: "Shipping", tagline: "Carriers, labels & returns", icon: PackageCheck, accent: "teal", basePath: "/shipping",
    description: "Multi-carrier rate shopping, label printing, tracking and returns management.",
    features: [
      { name: "Multi-carrier rate shopping", detail: "Compare live rates across carriers and pick the cheapest or fastest at checkout." },
      { name: "Label printing", detail: "Generate and print compliant shipping labels individually or in bulk." },
      { name: "Shipment tracking", detail: "Track every parcel and surface status updates to customers automatically." },
      { name: "Returns (RMA)", detail: "Issue return labels and manage the full RMA lifecycle." },
    ],
  },
  {
    key: "payments", name: "Payments", tagline: "Orchestration & PCI vault", icon: CreditCard, accent: "green", basePath: "/payments",
    description: "Route payments across processors with failover, a PCI-DSS vault and chargeback handling.",
    features: [
      { name: "Payment orchestration", detail: "Route each transaction to the best processor by cost, region and success rate." },
      { name: "Processor failover", detail: "Automatically retry on a backup processor if the primary declines or is unavailable." },
      { name: "PCI-DSS vault", detail: "Tokenize and store cards in a PCI-DSS compliant vault — your app never touches raw card data." },
      { name: "Chargeback management", detail: "Track disputes, gather evidence and respond to chargebacks from one place." },
    ],
  },
  {
    key: "ai_analytics", name: "AI Analytics", tagline: "Forecasts, fraud & NL queries", icon: Sparkles, accent: "purple", basePath: "/analytics",
    description: "Demand forecasting, fraud and churn detection, and natural-language queries with narratives.",
    features: [
      { name: "Demand forecasting", detail: "Predict sales by product, store and season to plan stock and staffing." },
      { name: "Fraud detection", detail: "Flag anomalous transactions and refunds in real time for review." },
      { name: "Churn prediction", detail: "Identify customers likely to lapse and trigger retention offers automatically." },
      { name: "Natural-language queries & narratives", detail: "Ask questions in plain English and get charts plus a written explanation of the trend." },
    ],
  },
  {
    key: "system_admin", name: "System Admin", tagline: "Tenant, RBAC & hardware", icon: ServerCog, accent: "navy", basePath: "/sys-admin",
    description: "Configure the tenant, manage roles and permissions, devices and integrations.",
    features: [
      { name: "Tenant configuration", detail: "Set branding, locale, fiscal calendar and which modules are enabled for the organization." },
      { name: "Roles & permissions (RBAC)", detail: "Define roles and fine-grained, scope-aware permissions across every module." },
      { name: "Hardware & device management", detail: "Register and monitor registers, scanners, printers and fuel pumps." },
      { name: "Integrations & API", detail: "Manage API keys, webhooks and outbound connectors to external systems." },
    ],
    links: [{ label: "System Settings", href: "/settings" }, { label: "Access & Roles", href: "/access" }, { label: "Integrations & API", href: "/integrations" }],
  },
];

export const catalogManifests: ModuleManifest[] = ENTRIES.map((e) => ({
  key: e.key,
  name: e.name,
  tagline: e.tagline,
  icon: e.icon,
  accent: e.accent,
  basePath: e.basePath,
  nav: [
    { id: "overview", label: "Overview", items: [{ id: `${e.key}-overview`, label: "Overview", href: e.basePath, icon: LayoutDashboard, module: e.key }] },
  ],
}));

export const MODULE_INFO: Partial<Record<ModuleKey, { description: string; features: Capability[]; links?: { label: string; href: string }[] }>> =
  Object.fromEntries(ENTRIES.map((e) => [e.key, { description: e.description, features: e.features, links: e.links }]));
