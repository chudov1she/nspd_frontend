"use client"

import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { TaskStatusBadge } from "@/components/tasks/task-status-badge"

function sourceLabel(source: Task["source"]) {
  return source === "file" ? "Файл" : "Текст"
}

function formatServerDate(value: string): string {
  return value.includes("T")
    ? new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(value))
    : value
}

export function TaskDetailHeader({ task }: { task: Task }) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{task.title}</h3>
          <p className="text-xs text-muted-foreground">{task.id}</p>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline">Источник: {sourceLabel(task.source)}</Badge>
        <Badge variant="outline">Поставил: {task.createdBy ?? "Не указан"}</Badge>
        <Badge variant="outline">
          Создана: {formatServerDate(task.createdAt)}
        </Badge>
      </div>
    </section>
  )
}
