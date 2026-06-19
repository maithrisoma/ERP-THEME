"use client";
import * as React from "react";
import { Package, Plus, Tag as TagIcon, Boxes, Check } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { formatMoney, money } from "@/platform/types";
import { PageHeader, Button, Tag, Card, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { ProductBody } from "@/components/crm-detail";
import { products as seed, type Product } from "@/modules/crm/data";

const CATS = ["Hardware", "Software", "Accessory", "Service"];

export default function CrmProductsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Product[]>(() => seed);
  const [sel, setSel] = React.useState<Product | null>(null);
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", sku: "", category: "Hardware", price: "100", stock: "100" });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => (cat ? p.category === cat : true) && (!q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q)));
  }, [list, search, cat]);

  function addProduct() {
    if (!form.name.trim()) return;
    setList((l) => [{ id: "pr_" + Math.random().toString(36).slice(2, 7), name: form.name.trim(), sku: form.sku || `SKU-${Math.floor(Math.random() * 9000) + 1000}`, category: form.category, price: money(Number(form.price) || 0), active: true, stock: Number(form.stock) || 0 }, ...l]);
    setAddOpen(false);
    setForm({ name: "", sku: "", category: "Hardware", price: "100", stock: "100" });
  }

  const columns: Column<Product>[] = [
    { key: "name", header: "Product", accessor: (p) => p.name, render: (p) => <span className="font-semibold text-navy">{p.name}</span> },
    { key: "sku", header: "SKU", accessor: (p) => p.sku, render: (p) => <span className="font-mono text-2xs text-ink-3">{p.sku}</span> },
    { key: "cat", header: "Category", accessor: (p) => p.category, render: (p) => <Tag tone="gray">{p.category}</Tag> },
    { key: "price", header: "Price", align: "right", accessor: (p) => p.price.amount, render: (p) => <span className="font-mono font-semibold text-navy">{formatMoney(p.price).replace(".00", "")}</span> },
    { key: "stock", header: "Stock", align: "right", accessor: (p) => p.stock, render: (p) => <span className="font-mono text-ink-2">{p.stock >= 9999 ? "∞" : p.stock}</span> },
    { key: "active", header: "Status", accessor: (p) => (p.active ? 1 : 0), render: (p) => <Tag tone={p.active ? "green" : "gray"}>{p.active ? "Active" : "Inactive"}</Tag> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Products" description="The catalog you sell — used in quotes and deals."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New product</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Products" value={list.length} icon={Package} tone="navy" />
        <StatCard label="Active" value={list.filter((p) => p.active).length} icon={Check} tone="green" />
        <StatCard label="Categories" value={new Set(list.map((p) => p.category)).size} icon={TagIcon} tone="purple" />
        <StatCard label="In stock" value={list.filter((p) => p.stock > 0).length} icon={Boxes} tone="teal" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU…" className="min-w-[220px] flex-1" />
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="sm:!w-44">
            <option value="">All categories</option>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} product{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(p) => p.id} onRowClick={setSel} empty="No products match." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New product" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addProduct}>Create product</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="POS Terminal Pro" /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SKU-1234" /></Field>
          <Field label="Category"><Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Price (USD)"><Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></Field>
          <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Product" title={sel?.name}>
        {sel && <ProductBody product={sel} />}
      </DetailModal>
    </>
  );
}
