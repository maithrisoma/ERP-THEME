"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, AccountBody } from "@/components/crm-detail";
import { accounts, byId } from "@/modules/crm/data";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const acc = byId(accounts, id);
  if (!acc) return <RecordNotFound entity="Account" href="/crm/accounts" label="Back to accounts" />;
  return (
    <DetailPage backHref="/crm/accounts" backLabel="All accounts" eyebrow="Account" title={acc.name}>
      <AccountBody account={acc} />
    </DetailPage>
  );
}
