"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, CaseBody } from "@/components/crm-detail";
import { cases, byId } from "@/modules/crm/data";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = byId(cases, id);
  if (!item) return <RecordNotFound entity="Case" href="/crm/cases" label="Back to cases" />;
  return (
    <DetailPage backHref="/crm/cases" backLabel="All cases" eyebrow={item.number} title={item.subject}>
      <CaseBody item={item} />
    </DetailPage>
  );
}
