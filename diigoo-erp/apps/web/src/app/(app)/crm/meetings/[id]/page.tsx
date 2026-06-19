"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, MeetingBody } from "@/components/crm-detail";
import { meetings, byId } from "@/modules/crm/data";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const m = byId(meetings, id);
  if (!m) return <RecordNotFound entity="Meeting" href="/crm/meetings" label="Back to meetings" />;
  return (
    <DetailPage backHref="/crm/meetings" backLabel="All meetings" eyebrow="Meeting" title={m.title}>
      <MeetingBody meeting={m} />
    </DetailPage>
  );
}
