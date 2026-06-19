"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, SearchX, Mail, Phone, Building2, Check, X, Globe, Users, DollarSign,
  ChevronRight, CalendarDays, Send, Download, ArrowRight, Tag as TagIcon, Boxes,
  CalendarClock, MapPin, Clock, User, type LucideIcon,
} from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useSession } from "@/platform/session";
import { formatMoney, money } from "@/platform/types";
import { downloadPdf } from "@/lib/pdf";
import { EmptyState, Button, Tag, Avatar, DetailRow, type Tone } from "@/components/ui/primitives";
import {
  contacts, deals, quoteTotal,
  type Lead, type LeadStatus, type Account, type Contact, type Deal, type DealStage,
  type Quote, type QuoteStatus, type SupportCase, type CaseStatus, type Product,
  type Task, type TaskStatus, type Meeting, type Call,
} from "@/modules/crm/data";
import {
  LEAD_STATUS_LABEL, LEAD_STATUS_TONE, ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_TONE, CONTACT_TONE,
  STAGE_LABEL, STAGE_TONE, ADVANCEABLE, QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE,
  CASE_STATUS_LABEL, CASE_STATUS_TONE, CASE_PRIORITY_TONE, PRIORITY_LABEL, PRIORITY_TONE,
  TASK_STATUS_LABEL, TASK_STATUS_TONE, TASK_TYPE_LABEL,
} from "@/modules/crm/ui";

/** Back link shown at the top of every CRM detail (connecting) page. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange hover:underline">
      <ArrowLeft size={14} /> {label}
    </Link>
  );
}

export function RecordNotFound({ entity, href, label }: { entity: string; href: string; label: string }) {
  return (
    <div className="py-10">
      <EmptyState
        icon={SearchX}
        title={`${entity} not found`}
        description="This record may have been removed or the link is out of date."
        action={<Link href={href}><Button variant="primary">{label}</Button></Link>}
      />
    </div>
  );
}

/**
 * Full-page wrapper for a record (direct links / refresh). Mirrors the orange-
 * gradient header of the DetailModal so the look is identical whether a record
 * is opened in the popup or on its own page.
 */
export function DetailPage({ backHref, backLabel, title, eyebrow, children }: {
  backHref: string; backLabel: string; title: React.ReactNode; eyebrow?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href={backHref} label={backLabel} />
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="bg-gradient-to-br from-orange/20 via-orange/[.06] to-transparent px-6 pb-5 pt-5">
          {eyebrow && <div className="mb-0.5 text-2xs font-bold uppercase tracking-[1px] text-orange">{eyebrow}</div>}
          <h1 className="text-xl font-bold leading-tight text-navy">{title}</h1>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Small shared pieces ─────────────────────────────────────────────────────
function Subtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-3">{children}</p>;
}

const TONE_TEXT: Record<string, string> = {
  blue: "text-blue", green: "text-green", amber: "text-amber", orange: "text-orange",
  coral: "text-coral", purple: "text-purple", teal: "text-teal", navy: "text-navy", gray: "text-ink-3",
};
function ToneText({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn("font-semibold", TONE_TEXT[tone] ?? "text-ink-2")}>{children}</span>;
}

function Fields({ children }: { children: React.ReactNode }) {
  return <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">{children}</dl>;
}

function RelatedSection({ title, count, icon: Icon, children }: { title: string; count: number; icon?: LucideIcon; children?: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-3">{Icon && <Icon size={12} />} {title} ({count})</div>
      {count === 0 ? <div className="rounded-md bg-subtle py-4 text-center text-sm text-ink-3">None.</div> : <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function RelatedDeal({ deal: d }: { deal: Deal }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-line px-2.5 py-2">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{d.name}</span>
      <Tag tone={STAGE_TONE[d.stage]}>{STAGE_LABEL[d.stage]}</Tag>
      <span className="font-mono text-2xs font-semibold text-navy">{formatMoney(d.value).replace(".00", "")}</span>
    </div>
  );
}

function ContactLink({ contact: c }: { contact: Contact }) {
  return (
    <Link href={`/crm/contacts/${c.id}`} className="flex items-center gap-2.5 rounded-md border border-line px-2.5 py-2 transition-colors hover:border-orange/40 hover:bg-subtle">
      <Avatar name={c.name} tone={c.tone as Tone} size={26} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{c.name}</span>
      <span className="text-2xs text-ink-3">{c.title}</span>
    </Link>
  );
}

function MailButton({ email, label }: { email: string; label: string }) {
  return (
    <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
      <Mail size={14} /> {label}
    </a>
  );
}

// ─── Per-entity bodies (shared by the popup and the full page) ───────────────
export function LeadBody({ lead }: { lead: Lead }) {
  const canEdit = useSession((s) => s.can("create", "sales_crm"));
  const [status, setStatus] = React.useState<LeadStatus | null>(null);
  const current = status ?? lead.status;
  return (
    <>
      <Subtitle>{lead.company}</Subtitle>
      <div className="mt-1.5 flex items-center gap-2">
        <Tag tone={LEAD_STATUS_TONE[current]}>{LEAD_STATUS_LABEL[current]}</Tag>
        <span className="font-mono text-sm font-semibold text-navy">{formatMoney(lead.value).replace(".00", "")}</span>
      </div>
      <Fields>
        <DetailRow icon={Mail} label="Email" value={lead.email} />
        <DetailRow icon={Phone} label="Phone" value={lead.phone} />
        <DetailRow icon={Building2} label="Company" value={lead.company} />
        <DetailRow label="Source" value={lead.source} />
        <DetailRow label="Status" value={<ToneText tone={LEAD_STATUS_TONE[current]}>{LEAD_STATUS_LABEL[current]}</ToneText>} />
        <DetailRow label="Est. value" value={formatMoney(lead.value).replace(".00", "")} />
        <DetailRow label="Owner" value={lead.owner} />
        <DetailRow label="Created" value={lead.createdAt} />
      </Fields>
      <div className="mt-5 flex flex-wrap gap-2">
        {canEdit && current !== "qualified" && current !== "unqualified" && (
          <>
            <Button variant="primary" icon={Check} onClick={() => setStatus("qualified")}>Qualify</Button>
            <Button variant="outline" icon={X} onClick={() => setStatus("unqualified")}>Disqualify</Button>
          </>
        )}
        <MailButton email={lead.email} label="Email lead" />
      </div>
    </>
  );
}

export function AccountBody({ account }: { account: Account }) {
  const relContacts = contacts.filter((c) => c.company === account.name);
  const relDeals = deals.filter((d) => d.company === account.name);
  return (
    <>
      <Subtitle>{account.industry}</Subtitle>
      <div className="mt-1.5"><Tag tone={ACCOUNT_TYPE_TONE[account.type]}>{ACCOUNT_TYPE_LABEL[account.type]}</Tag></div>
      <Fields>
        <DetailRow icon={Globe} label="Website" value={account.website} />
        <DetailRow icon={Phone} label="Phone" value={account.phone} />
        <DetailRow icon={Users} label="Employees" value={account.employees} />
        <DetailRow icon={DollarSign} label="Revenue" value={formatMoney(account.revenue).replace(".00", "")} />
        <DetailRow label="Type" value={<ToneText tone={ACCOUNT_TYPE_TONE[account.type]}>{ACCOUNT_TYPE_LABEL[account.type]}</ToneText>} />
        <DetailRow label="Owner" value={account.owner} />
      </Fields>
      <RelatedSection title="Contacts" count={relContacts.length} icon={Users}>
        {relContacts.map((c) => <ContactLink key={c.id} contact={c} />)}
      </RelatedSection>
      <RelatedSection title="Deals" count={relDeals.length} icon={DollarSign}>
        {relDeals.map((d) => <RelatedDeal key={d.id} deal={d} />)}
      </RelatedSection>
    </>
  );
}

const CONTACT_STATUS_LABEL = { lead: "Lead", active: "Active", churned: "Churned" } as const;
export function ContactBody({ contact: c }: { contact: Contact }) {
  const relDeals = deals.filter((d) => d.company === c.company);
  return (
    <>
      <Subtitle>{c.title} · {c.company}</Subtitle>
      <div className="mt-1.5"><Tag tone={CONTACT_TONE[c.status]}>{CONTACT_STATUS_LABEL[c.status]}</Tag></div>
      <Fields>
        <DetailRow icon={Mail} label="Email" value={c.email} />
        <DetailRow icon={Phone} label="Phone" value={c.phone} />
        <DetailRow icon={Building2} label="Company" value={c.company} />
        <DetailRow label="Title" value={c.title} />
        <DetailRow label="Owner" value={c.owner} />
        <DetailRow label="Last touch" value={c.lastTouch} />
      </Fields>
      <div className="mt-5"><MailButton email={c.email} label="Email contact" /></div>
      <RelatedSection title="Deals at this company" count={relDeals.length} icon={DollarSign}>
        {relDeals.map((d) => <RelatedDeal key={d.id} deal={d} />)}
      </RelatedSection>
    </>
  );
}

export function DealBody({ deal }: { deal: Deal }) {
  const canEdit = useSession((s) => s.can("update", "sales_crm"));
  const [stage, setStage] = React.useState<DealStage | null>(null);
  const cur = stage ?? deal.stage;
  const i = ADVANCEABLE.indexOf(cur);
  const relContacts = contacts.filter((c) => c.company === deal.company);
  return (
    <>
      <Subtitle>{deal.company}</Subtitle>
      <div className="mt-1.5 flex items-center gap-2"><Tag tone={STAGE_TONE[cur]}>{STAGE_LABEL[cur]}</Tag><Tag tone="gray">{deal.probability}%</Tag></div>
      <div className="mt-4 rounded-md border border-navy/15 bg-navy/[.04] p-4">
        <div className="text-2xs uppercase tracking-wide text-ink-3">Deal value</div>
        <div className="font-mono text-2xl font-bold text-navy">{formatMoney(deal.value)}</div>
      </div>
      <Fields>
        <DetailRow icon={Building2} label="Company" value={deal.company} />
        <DetailRow label="Stage" value={<ToneText tone={STAGE_TONE[cur]}>{STAGE_LABEL[cur]}</ToneText>} />
        <DetailRow label="Owner" value={deal.owner} />
        <DetailRow label="Probability" value={`${deal.probability}%`} />
        <DetailRow icon={CalendarDays} label="Expected close" value={deal.closeDate} />
      </Fields>
      {canEdit && cur !== "won" && cur !== "lost" && (
        <div className="mt-5 flex gap-2">
          <Button variant="primary" iconRight={ChevronRight} className="flex-1" onClick={() => setStage(i < ADVANCEABLE.length - 1 ? ADVANCEABLE[i + 1] : cur)}>{cur === "negotiation" ? "Mark won" : "Advance stage"}</Button>
          <Button variant="outline" icon={X} onClick={() => setStage("lost")}>Mark lost</Button>
        </div>
      )}
      {relContacts.length > 0 && (
        <RelatedSection title={`Contacts at ${deal.company}`} count={relContacts.length} icon={Users}>
          {relContacts.map((c) => <ContactLink key={c.id} contact={c} />)}
        </RelatedSection>
      )}
    </>
  );
}

export function QuoteBody({ quote }: { quote: Quote }) {
  const session = useSession();
  const canEdit = session.can("create", "sales_crm");
  const [status, setStatus] = React.useState<QuoteStatus | null>(null);
  const cur = status ?? quote.status;

  function exportQuote() {
    const b = session.tenant.branding;
    downloadPdf(`${quote.number}.pdf`, quote.number, [
      ["Account", quote.account], ["Status", QUOTE_STATUS_LABEL[cur]], ["Valid until", quote.validUntil], ["Owner", quote.owner],
      ...quote.lines.map((l) => [`${l.item} × ${l.qty}`, formatMoney(money(l.qty * l.price)).replace(".00", "")] as [string, string]),
      ["TOTAL", formatMoney(money(quoteTotal(quote))).replace(".00", "")],
    ], "Sales Quotation", { company: b.companyName, monogram: b.logoMonogram, primary: b.primary, accent: b.accent, product: `${b.productName} - Sales & CRM` });
  }

  return (
    <>
      <Subtitle>{quote.account}</Subtitle>
      <div className="mt-1.5"><Tag tone={QUOTE_STATUS_TONE[cur]}>{QUOTE_STATUS_LABEL[cur]}</Tag></div>
      <div className="mt-4 overflow-hidden rounded-md border border-line">
        <table className="w-full text-sm">
          <thead><tr className="bg-subtle text-2xs uppercase tracking-wide text-ink-3"><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
          <tbody>
            {quote.lines.map((l, idx) => (
              <tr key={idx} className="border-t border-line">
                <td className="px-3 py-2 text-ink-2">{l.item}</td>
                <td className="px-3 py-2 text-right font-mono text-ink-2">{l.qty}</td>
                <td className="px-3 py-2 text-right font-mono text-ink-3">{formatMoney(money(l.price)).replace(".00", "")}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-navy">{formatMoney(money(l.qty * l.price)).replace(".00", "")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-line bg-subtle"><td className="px-3 py-2 font-semibold text-navy" colSpan={3}>Total</td><td className="px-3 py-2 text-right font-mono font-bold text-navy">{formatMoney(money(quoteTotal(quote))).replace(".00", "")}</td></tr></tfoot>
        </table>
      </div>
      <Fields>
        <DetailRow label="Valid until" value={quote.validUntil} />
        <DetailRow label="Owner" value={quote.owner} />
        <DetailRow label="Created" value={quote.createdAt} />
      </Fields>
      <div className="mt-5 flex flex-wrap gap-2">
        {canEdit && cur === "draft" && <Button variant="primary" icon={Send} onClick={() => setStatus("sent")}>Send quote</Button>}
        {canEdit && cur === "sent" && <><Button variant="subtle" icon={Check} onClick={() => setStatus("accepted")}>Mark accepted</Button><Button variant="ghost" icon={X} onClick={() => setStatus("declined")}>Decline</Button></>}
        <Button variant="outline" icon={Download} onClick={exportQuote}>Download PDF</Button>
      </div>
    </>
  );
}

const CASE_ORDER: CaseStatus[] = ["open", "in_progress", "resolved", "closed"];
export function CaseBody({ item }: { item: SupportCase }) {
  const canEdit = useSession((s) => s.can("create", "sales_crm"));
  const [status, setStatus] = React.useState<CaseStatus | null>(null);
  const cur = status ?? item.status;
  const i = CASE_ORDER.indexOf(cur);
  return (
    <>
      <Subtitle>{item.account}</Subtitle>
      <div className="mt-1.5 flex items-center gap-2"><Tag tone={CASE_STATUS_TONE[cur]}>{CASE_STATUS_LABEL[cur]}</Tag><Tag tone={CASE_PRIORITY_TONE[item.priority]}>{item.priority}</Tag></div>
      <div className="mt-5 flex items-center gap-1">
        {CASE_ORDER.map((s, idx) => (
          <React.Fragment key={s}>
            <div className={`flex-1 rounded-full py-1 text-center text-[10px] font-semibold ${idx <= i ? "bg-orange/15 text-orange" : "bg-subtle text-ink-3"}`}>{CASE_STATUS_LABEL[s]}</div>
            {idx < CASE_ORDER.length - 1 && <ArrowRight size={12} className={idx < i ? "text-orange" : "text-line"} />}
          </React.Fragment>
        ))}
      </div>
      <Fields>
        <DetailRow icon={Building2} label="Account" value={item.account} />
        <DetailRow label="Priority" value={item.priority} />
        <DetailRow label="Owner" value={item.owner} />
        <DetailRow label="Created" value={item.createdAt} />
      </Fields>
      {canEdit && cur !== "closed" && (
        <Button variant="primary" iconRight={ArrowRight} className="mt-5" onClick={() => setStatus(CASE_ORDER[i + 1])}>Move to {CASE_STATUS_LABEL[CASE_ORDER[i + 1]]}</Button>
      )}
    </>
  );
}

export function ProductBody({ product: p }: { product: Product }) {
  const canEdit = useSession((s) => s.can("create", "sales_crm"));
  const [active, setActive] = React.useState<boolean | null>(null);
  const isActive = active ?? p.active;
  return (
    <>
      <Subtitle><span className="font-mono">{p.sku}</span></Subtitle>
      <div className="mt-1.5"><Tag tone={isActive ? "green" : "gray"}>{isActive ? "Active" : "Inactive"}</Tag></div>
      <div className="mt-4 font-mono text-2xl font-bold text-navy">{formatMoney(p.price).replace(".00", "")}</div>
      <Fields>
        <DetailRow label="SKU" value={p.sku} />
        <DetailRow icon={TagIcon} label="Category" value={p.category} />
        <DetailRow icon={Boxes} label="Stock" value={p.stock >= 9999 ? "Unlimited" : p.stock} />
        <DetailRow label="Unit price" value={formatMoney(p.price).replace(".00", "")} />
      </Fields>
      {canEdit && <Button variant="outline" className="mt-5" onClick={() => setActive(!isActive)}>{isActive ? "Deactivate" : "Activate"}</Button>}
    </>
  );
}

export function TaskBody({ task }: { task: Task }) {
  const canEdit = useSession((s) => s.can("create", "sales_crm"));
  const [status, setStatus] = React.useState<TaskStatus | null>(null);
  const cur = status ?? task.status;
  return (
    <>
      <Subtitle>{task.related}</Subtitle>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Tag tone={TASK_STATUS_TONE[cur]}>{TASK_STATUS_LABEL[cur]}</Tag>
        <Tag tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]} priority</Tag>
      </div>
      <Fields>
        <DetailRow icon={Building2} label="Related to" value={task.related} />
        <DetailRow icon={CalendarDays} label="Due" value={task.due} />
        <DetailRow label="Type" value={TASK_TYPE_LABEL[task.type]} />
        <DetailRow label="Priority" value={PRIORITY_LABEL[task.priority]} />
        <DetailRow label="Owner" value={task.owner} />
      </Fields>
      {canEdit && (
        <div className="mt-5 flex flex-wrap gap-2">
          {cur === "todo" && <Button variant="outline" onClick={() => setStatus("in_progress")}>Start task</Button>}
          {cur !== "done" && <Button variant="primary" icon={Check} onClick={() => setStatus("done")}>Mark complete</Button>}
          {cur === "done" && <Button variant="outline" onClick={() => setStatus("todo")}>Reopen</Button>}
        </div>
      )}
    </>
  );
}

function dayLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
export function MeetingBody({ meeting: m }: { meeting: Meeting }) {
  return (
    <>
      <Subtitle>{m.account}</Subtitle>
      <div className="mt-1.5"><Tag tone={m.location === "On-site" ? "teal" : "blue"}>{m.location}</Tag></div>
      <Fields>
        <DetailRow icon={Building2} label="Account" value={m.account} />
        <DetailRow icon={CalendarClock} label="Date" value={dayLabel(m.date)} />
        <DetailRow icon={Clock} label="Time" value={`${m.start} – ${m.end}`} />
        <DetailRow icon={MapPin} label="Location" value={m.location} />
        <DetailRow label="Owner" value={m.owner} />
      </Fields>
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-3"><Users size={12} /> Attendees ({m.attendees.length})</div>
        <div className="space-y-1.5">{m.attendees.map((a, idx) => (
          <div key={idx} className="flex items-center gap-2.5 rounded-md border border-line px-2.5 py-2"><Avatar name={a} tone="navy" size={26} /><span className="text-sm font-medium text-navy">{a}</span></div>
        ))}</div>
      </div>
    </>
  );
}

const CALL_OUTCOMES = ["Interested", "Left voicemail", "Needs follow-up", "Closed won", "Not a fit"];
export function CallBody({ call }: { call: Call }) {
  const canEdit = useSession((s) => s.can("create", "sales_crm"));
  const [state, setState] = React.useState<{ status: "scheduled" | "completed"; outcome: string } | null>(null);
  const status = state?.status ?? call.status;
  const outcome = state?.outcome ?? call.outcome;
  return (
    <>
      <Subtitle>{call.contact}</Subtitle>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Tag tone={call.direction === "inbound" ? "teal" : "blue"}>{call.direction === "inbound" ? "Inbound" : "Outbound"}</Tag>
        <Tag tone={status === "completed" ? "green" : "amber"}>{status === "completed" ? "Completed" : "Scheduled"}</Tag>
      </div>
      <Fields>
        <DetailRow icon={User} label="Contact" value={call.contact} />
        <DetailRow icon={Clock} label="When" value={`${call.date} · ${call.time}`} />
        <DetailRow label="Duration" value={`${call.durationMin} min`} />
        <DetailRow label="Outcome" value={outcome} />
        <DetailRow label="Owner" value={call.owner} />
      </Fields>
      {canEdit && status === "scheduled" && (
        <div className="mt-5">
          <div className="mb-1.5 text-xs font-semibold text-ink-3">Log outcome</div>
          <div className="flex flex-wrap gap-1.5">
            {CALL_OUTCOMES.map((o) => <Button key={o} size="sm" variant="outline" onClick={() => setState({ status: "completed", outcome: o })}>{o}</Button>)}
          </div>
        </div>
      )}
    </>
  );
}
