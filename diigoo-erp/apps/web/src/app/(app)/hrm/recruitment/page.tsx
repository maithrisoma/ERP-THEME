"use client";
import * as React from "react";
import { Briefcase, Users, MessageSquare, Send, Star, Plus, ChevronRight, X, Mail, MapPin, Building2, CalendarDays, Check, UserCheck } from "@/components/icon/lucide";
import { PageHeader, Card, CardHeader, StatCard, Tag, Avatar, Button, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { useNotifications } from "@/platform/notifications";
import { TYPE_LABEL, fmtDate } from "@/modules/hrm/ui";
import type { JobRequisition, PipelineStage, Candidate } from "@/modules/hrm/types";

const REQ_STATUS_TONE: Record<JobRequisition["status"], Tone> = { open: "green", on_hold: "amber", closed: "gray", filled: "blue" };
const REQ_STATUS_LABEL: Record<JobRequisition["status"], string> = { open: "Open", on_hold: "On hold", closed: "Closed", filled: "Filled" };
const STAGE_ORDER: PipelineStage[] = ["applied", "screening", "interview", "offer", "hired", "rejected"];
const ADVANCE_ORDER: PipelineStage[] = ["applied", "screening", "interview", "offer", "hired"];
const STAGE_TONE: Record<PipelineStage, Tone> = { applied: "gray", screening: "blue", interview: "purple", offer: "amber", hired: "green", rejected: "coral" };
const STAGE_LABEL: Record<PipelineStage, string> = { applied: "Applied", screening: "Screening", interview: "Interview", offer: "Offer", hired: "Hired", rejected: "Rejected" };

export default function RecruitmentPage() {
  return (
    <FeatureGate feature="hr.recruitment">
      <RecruitmentInner />
    </FeatureGate>
  );
}

function RecruitmentInner() {
  const [requisitions, setRequisitions] = React.useState<JobRequisition[]>(() => db.requisitions);
  const [candidates, setCandidates] = React.useState<Candidate[]>(() => db.candidates);
  const [newReqOpen, setNewReqOpen] = React.useState(false);
  const [selCandidate, setSelCandidate] = React.useState<Candidate | null>(null);
  const [selReq, setSelReq] = React.useState<JobRequisition | null>(null);

  const pipeline = React.useMemo(() => {
    const grouped = Object.fromEntries(STAGE_ORDER.map((s) => [s, [] as Candidate[]])) as Record<PipelineStage, Candidate[]>;
    candidates.forEach((c) => grouped[c.stage].push(c));
    return grouped;
  }, [candidates]);

  const openRequisitions = requisitions.filter((r) => r.status === "open").length;
  const totalApplicants = requisitions.reduce((s, r) => s + r.applicantCount, 0);

  function moveCandidate(id: string, stage: PipelineStage) {
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
    // Entering the interview stage notifies the assigned interviewer.
    if (stage === "interview") {
      const c = candidates.find((x) => x.id === id);
      if (c) {
        const req = db.byId(db.requisitions, c.requisitionId);
        pushNotif({
          to: c.interviewerId,
          iconKey: "interview",
          tone: "purple",
          title: "Interview to conduct",
          body: `${c.name} reached the interview stage${req ? ` for ${req.title}` : ""}.`,
          href: "/hrm/recruitment",
        });
        setNotifiedName(db.employeeName(c.interviewerId));
      }
    }
  }
  function advance(c: Candidate) {
    const i = ADVANCE_ORDER.indexOf(c.stage);
    if (i >= 0 && i < ADVANCE_ORDER.length - 1) moveCandidate(c.id, ADVANCE_ORDER[i + 1]);
  }
  // Active employees who can be assigned as interviewers.
  const interviewers = React.useMemo(() => db.employees.filter((e) => e.status !== "terminated"), []);
  const pushNotif = useNotifications((s) => s.push);
  const ensureNotif = useNotifications((s) => s.ensure);
  const [notifiedName, setNotifiedName] = React.useState<string | null>(null);

  // Clear the "notified" confirmation when switching candidates.
  React.useEffect(() => setNotifiedName(null), [selCandidate?.id]);

  // Seed the existing interview-stage assignments into the interviewers' inboxes
  // (idempotent — deterministic ids mean it never duplicates across reloads).
  React.useEffect(() => {
    db.candidates.filter((c) => c.stage === "interview").forEach((c) => {
      const req = db.byId(db.requisitions, c.requisitionId);
      ensureNotif({
        id: `iv_${c.id}`,
        to: c.interviewerId,
        iconKey: "interview",
        tone: "purple",
        title: "Interview to conduct",
        body: `You're assigned to interview ${c.name}${req ? ` for ${req.title}` : ""}.`,
        href: "/hrm/recruitment",
      });
    });
  }, [ensureNotif]);

  // Reassign the interviewer for a candidate — and notify the new interviewer.
  function assignInterviewer(id: string, interviewerId: string) {
    const c = candidates.find((x) => x.id === id);
    setCandidates((cs) => cs.map((x) => (x.id === id ? { ...x, interviewerId } : x)));
    setSelCandidate((s) => (s && s.id === id ? { ...s, interviewerId } : s));
    if (!c) return;
    const req = db.byId(db.requisitions, c.requisitionId);
    pushNotif({
      to: interviewerId,
      iconKey: "interview",
      tone: "purple",
      title: "New interview assignment",
      body: `You're assigned to interview ${c.name}${req ? ` for ${req.title}` : ""}.`,
      href: "/hrm/recruitment",
    });
    setNotifiedName(db.employeeName(interviewerId));
  }

  // New requisition form
  const [form, setForm] = React.useState({ title: "", departmentId: db.departments[0]?.id ?? "", locationId: db.locations[0]?.id ?? "", employmentType: "full_time" as JobRequisition["employmentType"], openings: 1 });
  function createReq() {
    if (!form.title.trim()) return;
    const r: JobRequisition = {
      id: "jr_" + Math.random().toString(36).slice(2, 7),
      title: form.title.trim(),
      departmentId: form.departmentId,
      locationId: form.locationId,
      employmentType: form.employmentType,
      openings: Number(form.openings) || 1,
      status: "open",
      hiringManagerId: "",
      postedAt: new Date().toISOString().slice(0, 10),
      applicantCount: 0,
    };
    setRequisitions((rs) => [r, ...rs]);
    setNewReqOpen(false);
    setForm((f) => ({ ...f, title: "", openings: 1 }));
  }

  const columns: Column<JobRequisition>[] = [
    { key: "title", header: "Role", accessor: (r) => r.title, render: (r) => <span className="font-semibold text-navy">{r.title}</span> },
    { key: "dept", header: "Department", accessor: (r) => db.departmentName(r.departmentId), render: (r) => <span className="text-ink-2">{db.departmentName(r.departmentId)}</span> },
    { key: "loc", header: "Location", render: (r) => <span className="text-ink-3">{db.locationName(r.locationId)}</span> },
    { key: "type", header: "Type", render: (r) => <Tag tone="gray">{TYPE_LABEL[r.employmentType]}</Tag> },
    { key: "openings", header: "Openings", align: "right", accessor: (r) => r.openings, render: (r) => <span className="font-mono text-navy">{r.openings}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={REQ_STATUS_TONE[r.status]}>{REQ_STATUS_LABEL[r.status]}</Tag> },
    { key: "applicants", header: "Applicants", align: "right", accessor: (r) => r.applicantCount, render: (r) => <span className="font-mono font-semibold text-navy">{r.applicantCount}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Recruitment"
        description="Open requisitions and the candidate pipeline across the organization."
        actions={<Button icon={Plus} variant="primary" onClick={() => setNewReqOpen(true)}>New requisition</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open requisitions" value={openRequisitions} icon={Briefcase} tone="purple" hint="hiring now" />
        <StatCard label="Total applicants" value={totalApplicants} icon={Users} tone="navy" hint="all requisitions" />
        <StatCard label="In interview" value={pipeline.interview.length} icon={MessageSquare} tone="blue" hint="active candidates" />
        <StatCard label="Offers extended" value={pipeline.offer.length} icon={Send} tone="amber" hint="awaiting decision" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Open requisitions" description={`${requisitions.length} requisitions tracked`} icon={Briefcase} />
        <DataTable columns={columns} rows={requisitions} keyField={(r) => r.id} onRowClick={setSelReq} empty="No open requisitions." />
      </Card>

      <Card className="mt-4">
        <CardHeader title="Candidate pipeline" description="Advance or reject candidates through each stage" icon={Users} />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stage) => {
            const list = pipeline[stage];
            return (
              <div key={stage} className="flex w-[230px] shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-2">{STAGE_LABEL[stage]}</span>
                  <Tag tone={STAGE_TONE[stage]}>{list.length}</Tag>
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-md bg-subtle p-2">
                  {list.length === 0 ? (
                    <div className="rounded-md border border-dashed border-line py-6 text-center text-2xs text-ink-3">No candidates</div>
                  ) : (
                    list.map((c) => (
                      <div key={c.id} className="rounded-md border border-line bg-surface p-2.5 shadow-card transition-colors hover:border-orange/40">
                        <button onClick={() => setSelCandidate(c)} className="block w-full text-left">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.name} tone={c.avatarTone as Tone} size={30} />
                            <div className="min-w-0 leading-tight">
                              <div className="truncate text-sm font-semibold text-navy">{c.name}</div>
                              <div className="truncate text-2xs text-ink-3">{db.byId(db.requisitions, c.requisitionId)?.title ?? "—"}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Tag tone="gray">{c.source}</Tag>
                            <span className="inline-flex items-center gap-0.5 font-mono text-2xs font-semibold text-amber"><Star size={11} className="fill-amber" /> {c.rating.toFixed(1)}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-2xs text-ink-3" title={`Interviewer: ${db.employeeName(c.interviewerId)}`}>
                            <UserCheck size={12} className="shrink-0 text-orange" />
                            <Avatar name={db.employeeName(c.interviewerId)} tone="navy" size={16} />
                            <span className="truncate">{db.employeeName(c.interviewerId)}</span>
                          </div>
                        </button>
                        {stage !== "hired" && stage !== "rejected" && (
                          <div className="mt-2 flex gap-1">
                            <Button size="sm" variant="subtle" iconRight={ChevronRight} className="flex-1" onClick={() => advance(c)}>
                              {stage === "offer" ? "Hire" : "Advance"}
                            </Button>
                            <Button size="sm" variant="ghost" icon={X} aria-label="Reject" onClick={() => moveCandidate(c.id, "rejected")} />
                          </div>
                        )}
                        {stage === "rejected" && (
                          <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => moveCandidate(c.id, "applied")}>Reconsider</Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* New requisition modal */}
      <Modal
        open={newReqOpen}
        onClose={() => setNewReqOpen(false)}
        title="New requisition"
        description="Open a new role for hiring."
        size="md"
        footer={<><Button variant="ghost" onClick={() => setNewReqOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={createReq}>Create requisition</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role title" required className="col-span-2"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Store Manager — Westgate" /></Field>
          <Field label="Department"><Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>{db.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="Location"><Select value={form.locationId} onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}>{db.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
          <Field label="Type"><Select value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as JobRequisition["employmentType"] }))}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Openings"><Input type="number" min={1} value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: Number(e.target.value) }))} /></Field>
        </div>
      </Modal>

      {/* Candidate detail drawer */}
      <DetailModal open={!!selCandidate} onClose={() => setSelCandidate(null)} eyebrow="Candidate" title={selCandidate?.name}>
        {selCandidate && (() => {
          const c = selCandidate;
          const req = db.byId(db.requisitions, c.requisitionId);
          return (
            <div>
              <p className="text-sm text-ink-3">{req?.title ?? "—"}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Tag tone={STAGE_TONE[c.stage]}>{STAGE_LABEL[c.stage]}</Tag>
                <span className="inline-flex items-center gap-0.5 font-mono text-2xs font-semibold text-amber"><Star size={11} className="fill-amber" /> {c.rating.toFixed(1)}</span>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <DRow icon={Mail} label="Email" value={c.email} />
                <DRow icon={Briefcase} label="Requisition" value={req?.title ?? "—"} />
                <DRow icon={MapPin} label="Location" value={req ? db.locationName(req.locationId) : "—"} />
                <DRow icon={CalendarDays} label="Applied" value={fmtDate(c.appliedAt)} />
                <DRow label="Source" value={c.source} />
              </dl>

              {/* Interview assignment — every applicant is assigned an interviewer. */}
              <div className="mt-5 rounded-md border border-line bg-subtle p-3">
                <div className="mb-2 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-ink-3"><UserCheck size={12} className="text-orange" /> Interview assignment</div>
                <div className="mb-2.5 flex items-center gap-2">
                  <Avatar name={db.employeeName(c.interviewerId)} tone="navy" size={32} />
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-sm font-semibold text-navy">{db.employeeName(c.interviewerId)}</div>
                    <div className="truncate text-2xs text-ink-3">{db.positionTitle(db.byId(db.employees, c.interviewerId)?.positionId ?? "")}</div>
                  </div>
                </div>
                <Field label="Reassign interviewer">
                  <Select value={c.interviewerId} onChange={(e) => assignInterviewer(c.id, e.target.value)}>
                    {interviewers.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {db.positionTitle(emp.positionId)}</option>)}
                  </Select>
                </Field>
                {notifiedName ? (
                  <p className="mt-2 flex items-center gap-1.5 text-2xs font-medium text-green"><Check size={12} /> {notifiedName} was notified of this interview.</p>
                ) : (
                  <p className="mt-2 text-2xs text-ink-3">The assigned interviewer is notified automatically.</p>
                )}
              </div>
              {c.stage !== "hired" && c.stage !== "rejected" && (
                <div className="mt-6 flex gap-2">
                  <Button variant="primary" icon={Check} className="flex-1" onClick={() => { advance(c); setSelCandidate(null); }}>{c.stage === "offer" ? "Hire" : "Advance"}</Button>
                  <Button variant="outline" icon={X} onClick={() => { moveCandidate(c.id, "rejected"); setSelCandidate(null); }}>Reject</Button>
                </div>
              )}
            </div>
          );
        })()}
      </DetailModal>

      {/* Requisition detail popup */}
      <DetailModal open={!!selReq} onClose={() => setSelReq(null)} eyebrow="Requisition" title={selReq?.title}>
        {selReq && (() => {
          const r = selReq;
          const cands = candidates.filter((c) => c.requisitionId === r.id);
          return (
            <div>
              <div className="flex flex-wrap gap-1.5"><Tag tone={REQ_STATUS_TONE[r.status]}>{REQ_STATUS_LABEL[r.status]}</Tag><Tag tone="gray">{TYPE_LABEL[r.employmentType]}</Tag></div>
              <dl className="mt-5 space-y-3 text-sm">
                <DRow icon={Building2} label="Department" value={db.departmentName(r.departmentId)} />
                <DRow icon={MapPin} label="Location" value={db.locationName(r.locationId)} />
                <DRow label="Openings" value={r.openings} />
                <DRow label="Applicants" value={r.applicantCount} />
                <DRow icon={CalendarDays} label="Posted" value={fmtDate(r.postedAt)} />
                <DRow label="Hiring manager" value={db.employeeName(r.hiringManagerId) || "—"} />
              </dl>
              <div className="mt-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-3">Candidates ({cands.length})</div>
                <div className="space-y-1.5">
                  {cands.length === 0 ? (
                    <div className="rounded-md bg-subtle py-4 text-center text-xs text-ink-3">No candidates yet.</div>
                  ) : (
                    cands.map((c) => (
                      <button key={c.id} onClick={() => { setSelReq(null); setSelCandidate(c); }} className="flex w-full items-center gap-2.5 rounded-md border border-line px-2.5 py-2 text-left hover:bg-subtle">
                        <Avatar name={c.name} tone={c.avatarTone as Tone} size={26} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{c.name}</span>
                        <Tag tone={STAGE_TONE[c.stage]}>{STAGE_LABEL[c.stage]}</Tag>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </DetailModal>
    </>
  );
}

function DRow({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">{Icon && <Icon size={13} />}{label}</dt>
      <dd className="text-right font-medium text-ink-2">{value}</dd>
    </div>
  );
}
