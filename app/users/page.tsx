import { AdminShell } from "@/components/admin-shell"
import { UsersTable } from "@/components/users/users-table"

export default function UsersPage() {
  return (
    <AdminShell title="Пользователи">
      <UsersTable />
    </AdminShell>
  )
}
