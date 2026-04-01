"use client"

import type { Task } from "@/lib/types"

export function TaskLogList({ task }: { task: Task }) {
  const logs = [...(task.logs ?? [])]
  const levelLabel: Record<"info" | "warning" | "error", string> = {
    info: "INFO",
    warning: "WARN",
    error: "ERROR",
  }

  return (
    <section className="space-y-2 rounded-md border bg-muted/20 p-3">
      <p className="text-sm font-medium">Логи</p>
      {logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Логи отсутствуют</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-md border bg-background p-2 font-mono text-[11px] leading-5">
          {logs.map((log, idx) => (
            <p key={`${log.at}-${idx}`} className={log.level === "error" ? "text-destructive" : "text-foreground"}>
              [{log.at}] [{levelLabel[log.level]}] {log.message}
              {log.cadastralNumber ? ` (КН: ${log.cadastralNumber})` : ""}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
