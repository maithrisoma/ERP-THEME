"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, LeadBody } from "@/components/crm-detail";
import { leads, byId } from "@/modules/crm/data";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const lead = byId(leads, id);
  if (!lead) return <RecordNotFound entity="Lead" href="/crm/leads" label="Back to leads" />;
  return (
    <DetailPage backHref="/crm/leads" backLabel="All leads" eyebrow="Lead" title={lead.name}>
      <LeadBody lead={lead} />
    </DetailPage>
  );
}
