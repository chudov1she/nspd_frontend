import { AdminShell } from "@/components/admin-shell"
import { TasksWorkspace } from "@/components/tasks/tasks-workspace"

export default function TasksPage() {
  return (
    <AdminShell title="Задачи">
      <TasksWorkspace />
    </AdminShell>
  )
}
