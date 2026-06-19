"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { IconButton } from "./primitives";

function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

function useEscape(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

const SIZE: Record<string, string> = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; description?: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; size?: keyof typeof SIZE;
}) {
  const mounted = useMounted();
  useEscape(open, onClose);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-[2px] sm:p-8" onClick={onClose}>
      <div className={cn("animate-fade-in mt-8 w-full rounded-lg bg-surface shadow-pop", SIZE[size])} onClick={(e) => e.stopPropagation()}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              {title && <h2 className="text-md font-bold text-navy">{title}</h2>}
              {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
            </div>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Centered record popup used for every "open a record" interaction across the
 * app — an orange-gradient header with the record title + close button, then a
 * scrollable body. Shares the same body content as the full detail pages.
 */
export function DetailModal({ open, onClose, title, eyebrow, children, footer, size = "lg" }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; eyebrow?: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; size?: keyof typeof SIZE;
}) {
  const mounted = useMounted();
  useEscape(open, onClose);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-[2px] sm:p-8" onClick={onClose}>
      <div className={cn("animate-fade-in mt-6 w-full overflow-hidden rounded-xl bg-surface shadow-pop", SIZE[size])} onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-orange/20 via-orange/[.06] to-transparent px-6 pb-5 pt-5">
          {eyebrow && <div className="mb-0.5 text-2xs font-bold uppercase tracking-[1px] text-orange">{eyebrow}</div>}
          {title && <h2 className="pr-9 text-xl font-bold leading-tight text-navy">{title}</h2>}
          <IconButton icon={X} label="Close" onClick={onClose} className="absolute right-4 top-4" />
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-subtle px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, description, children, footer, width = 460 }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; description?: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; width?: number;
}) {
  const mounted = useMounted();
  useEscape(open, onClose);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end bg-navy/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-slide-in flex h-full flex-col bg-surface shadow-pop" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-md font-bold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
