import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import type { TaskStatus } from "@/lib/types"
import { CheckCircleIcon, PauseCircleIcon, SpinnerIcon, WarningCircleIcon, ClockIcon } from "@phosphor-icons/react"

const statusLabel: Record<TaskStatus, string> = {
  pending: "В очереди",
  processing: "В работе",
  completed: "Завершена",
  warning: "Предупреждение",
  failed: "Ошибка",
  stopped: "Остановлена",
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const statusStyle: Record<TaskStatus, string> = {
    pending: "text-amber-300 border-amber-500/40 bg-amber-500/10",
    processing: "text-sky-300 border-sky-500/40 bg-sky-500/10",
    completed: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    warning: "text-amber-300 border-amber-500/40 bg-amber-500/10",
    failed: "text-destructive border-destructive/50 bg-destructive/10",
    stopped: "text-zinc-300 border-zinc-500/40 bg-zinc-500/10",
  }

  const iconByStatus: Record<TaskStatus, ReactNode> = {
    pending: <ClockIcon className="size-3" />,
    processing: <SpinnerIcon className="size-3 animate-spin" />,
    completed: <CheckCircleIcon className="size-3" />,
    warning: <WarningCircleIcon className="size-3" />,
    failed: <WarningCircleIcon className="size-3" />,
    stopped: <PauseCircleIcon className="size-3" />,
  }

  return (
    <Badge variant="outline" className={`capitalize ${statusStyle[status]}`}>
      {iconByStatus[status]}
      {statusLabel[status]}
    </Badge>
  )
}
