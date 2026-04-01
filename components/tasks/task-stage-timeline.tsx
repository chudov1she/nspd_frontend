"use client"

import type { Task, TaskStage } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const orderedStages: TaskStage[] = [
  "queued",
  "parsing",
  "api_lookup",
  "map_generation",
  "excel_build",
]

export function TaskStageTimeline({
  task,
  stageLabels,
}: {
  task: Task
  stageLabels: Record<Task["stage"], string>
}) {
  const currentIndex = orderedStages.indexOf(task.stage)
  const isTerminal = task.stage === "done" || task.stage === "error" || task.stage === "stopped"

  function stepState(stage: TaskStage, index: number): "done" | "active" | "pending" {
    if (stage === task.stage) return "active"
    if (!isTerminal) return index < currentIndex ? "done" : "pending"
    if (task.stage === "done") return "done"
    return index < currentIndex ? "done" : "pending"
  }

  function stepStateLabel(state: "done" | "active" | "pending") {
    if (state === "done") return "Выполнено"
    if (state === "active") return "Текущая"
    return "Ожидание"
  }

  return (
    <section className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Стадии обработки</p>
        <Badge variant="outline">{stageLabels[task.stage]}</Badge>
      </div>
      <div className="space-y-2">
        {orderedStages.map((stage, index) => {
          const state = stepState(stage, index)
          const done = state === "done"
          const active = state === "active"
          return (
            <div
              key={stage}
              className={
                active
                  ? "flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-xs"
                  : "flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    active
                      ? "size-2 rounded-full bg-primary"
                      : done
                        ? "size-2 rounded-full bg-emerald-500"
                        : "size-2 rounded-full bg-muted"
                  }
                />
                <span className={active ? "font-medium" : "text-muted-foreground"}>
                  {stageLabels[stage]}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{stepStateLabel(state)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
