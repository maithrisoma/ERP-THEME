"use client";
import { useParams } from "next/navigation";
import { ProjectsList } from "../projects-list";

// Deep link to a project/task — renders the list with that record's pop-up open.
export default function ProjectDeepLink() {
  const { id } = useParams<{ id: string }>();
  return <ProjectsList initialOpenId={id} />;
}
