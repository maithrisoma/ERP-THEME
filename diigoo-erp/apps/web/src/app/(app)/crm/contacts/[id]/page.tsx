"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, ContactBody } from "@/components/crm-detail";
import { contacts, byId } from "@/modules/crm/data";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const c = byId(contacts, id);
  if (!c) return <RecordNotFound entity="Contact" href="/crm/contacts" label="Back to contacts" />;
  return (
    <DetailPage backHref="/crm/contacts" backLabel="All contacts" eyebrow="Contact" title={c.name}>
      <ContactBody contact={c} />
    </DetailPage>
  );
}
