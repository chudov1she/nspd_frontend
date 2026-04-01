import { AdminShell } from "@/components/admin-shell"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { DashboardLatestTasks } from "@/components/dashboard/dashboard-latest-tasks"

export default function Page() {
  return (
    <AdminShell title="Дашборд">
      <div className="space-y-4">
        <DashboardOverview />
        <DashboardLatestTasks />
      </div>
    </AdminShell>
  )
}
