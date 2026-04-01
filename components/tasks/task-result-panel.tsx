"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"
import { TaskResultViewer } from "@/components/tasks/task-result-viewer"
import { API_BASE_URL } from "@/lib/api/client"
import { DownloadSimpleIcon, EyeIcon } from "@phosphor-icons/react"

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.rel = "noreferrer"
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function TaskResultPanel({ task }: { task: Task }) {
  const canShowResult = task.status === "completed" || task.status === "warning" || task.status === "failed"
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  const resultDownloadUrl = `${origin}/api/v1/tasks/${task.id}/result-file`
  const resultUrl = resultDownloadUrl
  const mapImageByCadastral = React.useMemo(() => {
    const unique = Array.from(new Set(task.cadastralNumbers ?? []))
    return unique.reduce<Record<string, string>>((acc, cad) => {
      const safe = cad.replaceAll(":", "_")
      acc[cad] = `${origin}/api/v1/tasks/${task.id}/maps/${safe}_map.png`
      return acc
    }, {})
  }, [task.cadastralNumbers, task.id])

  if (!canShowResult) {
    return (
      <section className="space-y-2 rounded-md border bg-muted/20 p-3">
        <p className="text-sm font-medium">Результаты</p>
        <p className="text-xs text-muted-foreground">Результат будет доступен после завершения.</p>
      </section>
    )
  }

  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="border-b pb-2">
        <p className="text-sm font-medium">Результаты {task.hasPartialResult ? "(частичные)" : ""}</p>
      </div>

      {!resultUrl ? (
        <div className="rounded border bg-background p-2 text-xs text-muted-foreground">
          <p>
            {task.status === "completed"
              ? "Результат готов."
              : task.status === "warning"
                ? "Обработка завершена частично. Доступен частичный результат."
                : "Обработка завершена с ошибкой. Доступен частичный результат."}
          </p>
          <p className="mt-1">Файл: {task.reportName ?? "result.xlsx"}</p>
        </div>
      ) : null}

      <div className="rounded border bg-background p-2 text-xs">
        {resultUrl ? (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{task.reportName ?? `${task.id}.xlsx`}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" className="cursor-pointer" variant="outline" onClick={() => setViewerOpen(true)}>
                <EyeIcon />
                Открыть
              </Button>
              <Button
                size="sm"
                className="cursor-pointer"
                variant="outline"
                onClick={() => triggerDownload(resultDownloadUrl, task.reportName ?? `${task.id}.xlsx`)}
              >
                <DownloadSimpleIcon />
                Скачать
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{task.reportName ?? `${task.id}.xlsx`}</span>
            <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled>
              <EyeIcon />
              Открыть
            </Button>
            <Button size="sm" variant="outline" disabled>
              <DownloadSimpleIcon />
              Скачать
            </Button>
            </div>
          </div>
        )}
      </div>
      <TaskResultViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        resultFileUrl={resultUrl}
        title={task.reportName ?? `Результат ${task.id}`}
        taskId={task.id}
        mapImageByCadastral={mapImageByCadastral}
        previewData={task.resultPreview}
      />
    </section>
  )
}
