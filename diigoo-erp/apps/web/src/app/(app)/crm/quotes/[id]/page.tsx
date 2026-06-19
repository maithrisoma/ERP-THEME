"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, QuoteBody } from "@/components/crm-detail";
import { quotes, byId } from "@/modules/crm/data";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quote = byId(quotes, id);
  if (!quote) return <RecordNotFound entity="Quote" href="/crm/quotes" label="Back to quotes" />;
  return (
    <DetailPage backHref="/crm/quotes" backLabel="All quotes" eyebrow="Quote" title={quote.number}>
      <QuoteBody quote={quote} />
    </DetailPage>
  );
}
