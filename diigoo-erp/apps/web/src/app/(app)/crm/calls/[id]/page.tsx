"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, CallBody } from "@/components/crm-detail";
import { calls, byId } from "@/modules/crm/data";

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const call = byId(calls, id);
  if (!call) return <RecordNotFound entity="Call" href="/crm/calls" label="Back to calls" />;
  return (
    <DetailPage backHref="/crm/calls" backLabel="All calls" eyebrow="Call" title={call.subject}>
      <CallBody call={call} />
    </DetailPage>
  );
}
