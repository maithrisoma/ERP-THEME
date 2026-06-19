"use client";
import * as React from "react";
import { Search } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";

const baseField =
  "focus-ring h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-3/70 disabled:bg-subtle disabled:text-ink-3";

export function Field({ label, hint, error, required, children, className }: {
  label?: React.ReactNode; hint?: React.ReactNode; error?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-semibold text-ink-2">
          {label} {required && <span className="text-coral">*</span>}
        </label>
      )}
      {children}
      {error ? <span className="text-xs text-coral">{error}</span> : hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(baseField, className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(baseField, "h-auto min-h-[80px] py-2", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseField, "appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B7280' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(baseField, "pl-9")} />
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-orange" : "bg-line",
      )}
    >
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2", disabled && "cursor-not-allowed opacity-50")}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-line text-orange focus:ring-orange/40" />
      {label}
    </label>
  );
}
