"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, DealBody } from "@/components/crm-detail";
import { deals, byId } from "@/modules/crm/data";

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deal = byId(deals, id);
  if (!deal) return <RecordNotFound entity="Deal" href="/crm/pipeline" label="Back to pipeline" />;
  return (
    <DetailPage backHref="/crm/pipeline" backLabel="Pipeline" eyebrow="Deal" title={deal.name}>
      <DealBody deal={deal} />
    </DetailPage>
  );
}
