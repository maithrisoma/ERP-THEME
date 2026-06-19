"use client";
import * as React from "react";

/** Calls `handler` when a pointer event lands outside the ref'd element. */
export function useClickAway<T extends HTMLElement>(handler: () => void) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [handler]);
  return ref;
}

/** True only after the component has mounted on the client. */
export function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}
