"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  /** value used for sorting; enables the sort control when provided */
  accessor?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string | number;
  className?: string;
  headClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  dense?: boolean;
  className?: string;
}

export function DataTable<T>({ columns, rows, keyField, onRowClick, empty, dense, className }: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return rows;
    const acc = col.accessor;
    return [...rows].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, dir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDir("asc"); }
  }

  const alignCls = (a?: Column<T>["align"]) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line bg-surface", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn("border-b border-line bg-subtle px-3 py-2.5 text-2xs font-semibold uppercase tracking-wide text-ink-2 first:rounded-tl-lg last:rounded-tr-lg", alignCls(c.align), c.headClassName)}
              >
                {c.accessor ? (
                  <button onClick={() => toggleSort(c.key)} className="hover:text-orange">
                    {c.header}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-ink-3">
                {empty ?? "No records found."}
              </td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={keyField(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-line transition-colors last:border-0 even:bg-subtle hover:bg-[#eef2ff]",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn(dense ? "px-3 py-2" : "px-3 py-2.5", "align-middle text-ink-2", alignCls(c.align), c.className)}>
                  {c.render ? c.render(row) : (row as Record<string, React.ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
