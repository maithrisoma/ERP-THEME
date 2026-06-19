"use client";
import { useParams } from "next/navigation";
import { DetailPage, RecordNotFound, TaskBody } from "@/components/crm-detail";
import { tasks, byId } from "@/modules/crm/data";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const task = byId(tasks, id);
  if (!task) return <RecordNotFound entity="Task" href="/crm/tasks" label="Back to tasks" />;
  return (
    <DetailPage backHref="/crm/tasks" backLabel="All tasks" eyebrow="Task" title={task.subject}>
      <TaskBody task={task} />
    </DetailPage>
  );
}
