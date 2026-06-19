"use client";
import * as React from "react";
import { KeyRound, RotateCcw, Lock } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useSession } from "@/platform/session";
import { PageHeader, Card, Tag, SectionLabel, Button } from "@/components/ui/primitives";
import { RoleGate } from "@/components/ui/gate";
import {
  ROLES, ROLE_ORDER, MATRIX_MODULES, moduleAccess, ASSIGNABLE_ACCESS,
  ACCESS_LABEL, ACCESS_TONE, type RoleId, type ModuleKey, type MatrixAccess,
} from "@/platform/rbac";

const LOGIN_LABEL: Record<string, string> = {
  email_password: "Email + password", sso: "SSO / SAML", pin: "4–6 digit PIN",
  mobile_otp: "Mobile OTP", magic_link: "Magic link", email_ip_allowlist: "Email + IP allowlist",
};
const MFA_TONE = { mandatory: "coral", recommended: "amber", optional: "gray", builtin: "blue", na: "gray" } as const;

export default function AccessPage() {
  const currentRole = useSession((s) => s.principal.primaryRole);
  const overrides = useSession((s) => s.rbacOverrides);
  const setOverride = useSession((s) => s.setRbacOverride);
  const resetOverride = useSession((s) => s.resetRbacOverride);
  const clearOverrides = useSession((s) => s.clearRbacOverrides);
  const canEdit = useSession((s) => s.can("update", "system_admin"));
  const [editing, setEditing] = React.useState<{ role: RoleId; module: ModuleKey } | null>(null);

  const overrideCount = Object.keys(overrides).length;

  function apply(role: RoleId, module: ModuleKey, value: MatrixAccess) {
    if (value === moduleAccess(role, module)) resetOverride(role, module);
    else setOverride(role, module, value);
    setEditing(null);
  }

  return (
    <RoleGate module="system_admin">
      <PageHeader
        eyebrow="Platform · Access control"
        title="Access & Roles"
        description={canEdit
          ? "Set what each role can do in every module. Click any cell to grant or change access — changes apply across the app immediately."
          : "The role hierarchy and module permission matrix enforced on every request (RBAC + ABAC)."}
        actions={canEdit && overrideCount > 0 ? <Button variant="outline" icon={RotateCcw} onClick={clearOverrides}>Reset {overrideCount} override{overrideCount === 1 ? "" : "s"}</Button> : undefined}
      />

      {/* Role hierarchy */}
      <Card className="mb-4">
        <SectionLabel>Role hierarchy</SectionLabel>
        <div className="overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>Level</th><th>Role</th><th>Data scope</th><th>Login method</th><th>MFA</th></tr></thead>
            <tbody>
              {ROLE_ORDER.map((r) => {
                const def = ROLES[r];
                return (
                  <tr key={r} className={cn(r === currentRole && "!bg-orange/[.06]")}>
                    <td><code className="rounded bg-line/60 px-1.5 py-0.5 font-mono text-2xs text-navy">{def.level}</code></td>
                    <td className="font-semibold text-navy">{def.label}{r === currentRole && <Tag tone="orange" className="ml-2">you</Tag>}</td>
                    <td className="text-ink-3">{def.scope}</td>
                    <td className="text-ink-2"><span className="inline-flex items-center gap-1.5"><KeyRound size={12} className="text-ink-3" />{LOGIN_LABEL[def.login]}</span></td>
                    <td><Tag tone={MFA_TONE[def.mfa]}>{def.mfa}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Editable permission matrix */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Module permission matrix</SectionLabel>
          <span className="text-2xs text-ink-3">{ROLE_ORDER.length} roles × {MATRIX_MODULES.length} modules{canEdit ? " · click any cell to edit" : " · read-only"}</span>
        </div>

        {/* Legend */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs">
          {ASSIGNABLE_ACCESS.filter((a) => a !== "none").map((a) => (
            <span key={a} className="inline-flex items-center gap-1"><span className={cn("font-bold", ACCESS_TONE[a])}>{ACCESS_LABEL[a]}</span></span>
          ))}
          <span className="text-ink-3">— = no access</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-full ring-1 ring-orange" /> tenant override</span>
        </div>

        <div className="overflow-x-auto">
          <table className="border-collapse text-2xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 rounded-tl-md bg-subtle px-2.5 py-2 text-left font-semibold text-navy">Role</th>
                {MATRIX_MODULES.map((m, i) => (
                  <th key={m.key} title={m.label} className={cn("whitespace-nowrap bg-subtle px-2 py-2 text-center font-semibold text-navy", i === MATRIX_MODULES.length - 1 && "rounded-tr-md")}>{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_ORDER.map((role) => (
                <tr key={role} className="even:bg-subtle">
                  <td className={cn("sticky left-0 z-10 whitespace-nowrap bg-inherit px-2.5 py-1.5 text-left font-semibold text-navy", role === currentRole && "!bg-orange/[.06]")}>
                    <span className="mr-1.5 rounded bg-navy/[.06] px-1 font-mono text-[9px] text-navy">{ROLES[role].level}</span>
                    {ROLES[role].label}
                  </td>
                  {MATRIX_MODULES.map((m) => {
                    const key = `${role}:${m.key}`;
                    const overridden = key in overrides;
                    const access: MatrixAccess = overrides[key] ?? moduleAccess(role, m.key);
                    const isEditing = editing?.role === role && editing?.module === m.key;
                    return (
                      <td key={m.key} className="px-1.5 py-1 text-center">
                        {isEditing ? (
                          <select
                            autoFocus
                            value={access}
                            onChange={(e) => apply(role, m.key, e.target.value as MatrixAccess)}
                            onBlur={() => setEditing(null)}
                            className="focus-ring rounded border border-orange bg-surface px-1 py-0.5 text-2xs font-semibold text-navy"
                          >
                            {ASSIGNABLE_ACCESS.map((a) => <option key={a} value={a}>{a === "none" ? "none" : ACCESS_LABEL[a]}</option>)}
                          </select>
                        ) : (
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setEditing({ role, module: m.key })}
                            title={canEdit ? "Click to change" : undefined}
                            className={cn(
                              "rounded-full px-2 py-0.5 font-semibold transition-colors",
                              ACCESS_TONE[access],
                              overridden && "ring-1 ring-orange",
                              canEdit ? "cursor-pointer hover:bg-line/50" : "cursor-default",
                            )}
                          >
                            {ACCESS_LABEL[access]}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!canEdit && (
          <p className="note-box mt-4 flex items-center gap-2"><Lock size={13} /> Only administrators can change permissions. You have read-only access to this matrix.</p>
        )}
      </Card>
    </RoleGate>
  );
}
