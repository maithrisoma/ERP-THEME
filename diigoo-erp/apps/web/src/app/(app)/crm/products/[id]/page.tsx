"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, ProductBody } from "@/components/crm-detail";
import { products, byId } from "@/modules/crm/data";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const p = byId(products, id);
  if (!p) return <RecordNotFound entity="Product" href="/crm/products" label="Back to products" />;
  return (
    <DetailPage backHref="/crm/products" backLabel="All products" eyebrow="Product" title={p.name}>
      <ProductBody product={p} />
    </DetailPage>
  );
}
