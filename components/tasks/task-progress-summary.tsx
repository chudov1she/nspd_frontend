"use client"

import type { Task } from "@/lib/types"
import { CheckCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const orderedStages: Task["stage"][] = [
  "queued",
  "parsing",
  "api_lookup",
  "map_generation",
  "excel_build",
]

export function TaskProgressSummary({
  task,
  stageLabels,
}: {
  task: Task
  stageLabels: Record<Task["stage"], string>
}) {
  const total = task.cadastralNumbers.length
  const remaining = Math.max(total - task.processedCount, 0)
  const currentIndex = orderedStages.indexOf(task.stage)
  const isTerminal = task.stage === "done" || task.stage === "error" || task.stage === "stopped"

  function getStageState(stage: Task["stage"], idx: number): "done" | "active" | "pending" {
    if (stage === task.stage) return "active"
    if (task.stage === "done") return "done"
    if (isTerminal) return idx < currentIndex ? "done" : "pending"
    return idx < currentIndex ? "done" : "pending"
  }

  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex items-end justify-between">
        <p className="text-sm font-medium">Прогресс</p>
        <p className="text-lg font-semibold tabular-nums">{task.progress}%</p>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-foreground transition-all"
          style={{ width: `${task.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          Обработано: {task.processedCount} / {total}
        </span>
        <span>Осталось: {remaining}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border bg-background p-2">
          <p className="text-muted-foreground">Обработано</p>
          <p className="text-base font-semibold tabular-nums">{task.processedCount}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-muted-foreground">Успешно</p>
          <p className="text-base font-semibold tabular-nums">{task.successfulCount}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-muted-foreground">Ошибки</p>
          <p className="text-base font-semibold tabular-nums">{task.failedCount}</p>
        </div>
      </div>
      <div className="space-y-2 border-t pt-2">
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">Текущая стадия</p>
          <p className="font-medium">{stageLabels[task.stage]}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {orderedStages.map((stage, idx) => {
            const state = getStageState(stage, idx)
            return (
              <span
                key={stage}
                className={
                  state === "done"
                    ? "inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                    : state === "active"
                      ? "inline-flex items-center gap-1 rounded border border-primary/50 bg-primary/15 px-2 py-0.5 text-[11px] text-primary"
                      : "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] text-muted-foreground"
                }
              >
                {state === "done" ? (
                  <CheckCircleIcon className="size-3" />
                ) : state === "active" ? (
                  <SpinnerIcon className="size-3 animate-spin" />
                ) : null}
                {stageLabels[stage]}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
