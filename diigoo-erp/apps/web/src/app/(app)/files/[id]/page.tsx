"use client";
import { useParams } from "next/navigation";
import { FilesList } from "../files-list";

// Deep link to a document — renders the list with that record's pop-up open.
export default function FileDeepLink() {
  const { id } = useParams<{ id: string }>();
  return <FilesList initialOpenId={id} />;
}
