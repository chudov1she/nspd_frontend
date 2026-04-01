"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"
import { TaskSourceViewer } from "@/components/tasks/task-source-viewer"
import { API_BASE_URL } from "@/lib/api/client"
import { DownloadSimpleIcon, EyeIcon } from "@phosphor-icons/react"

function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`
}

function buildTextDownloadUrl(task: Task): string | undefined {
  if (task.sourceFileUrl) return resolveAssetUrl(task.sourceFileUrl)
  if (!task.sourceText) return undefined
  return `data:text/plain;charset=utf-8,${encodeURIComponent(task.sourceText)}`
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.rel = "noreferrer"
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function TaskSourcePanel({ task }: { task: Task }) {
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const [viewerSourceUrl, setViewerSourceUrl] = React.useState<string | undefined>(undefined)
  const [viewerTitle, setViewerTitle] = React.useState<string>("")
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  const fileNames =
    task.sourceFileNames && task.sourceFileNames.length > 0
      ? task.sourceFileNames
      : task.sourceFileName
        ? [task.sourceFileName]
        : []
  const sourceName =
    task.source === "file"
      ? fileNames.length > 0
        ? `Файлов: ${fileNames.length}`
        : "source.xlsx"
      : `${task.id}_input.txt`
  const openUrl = task.source === "file" ? undefined : buildTextDownloadUrl(task)
  const sourceProxyUrls = fileNames.map((name) => `${origin}/api/v1/tasks/${task.id}/sources/${encodeURIComponent(name)}`)

  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <p className="text-sm font-medium">Исходные данные</p>
        <p className="text-xs text-muted-foreground">{sourceName}</p>
      </div>

      <div className="rounded border bg-background p-2 text-xs">
        {task.source === "text" ? (
          <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
            {task.sourceText ?? "Текст не передан"}
          </pre>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Исходники загружены файлами. Список файлов:
            </p>
            <ul className="space-y-1">
              {fileNames.map((name, index) => (
                <li key={`${name}-${index}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{name}</span>
                  <div className="flex items-center gap-2">
                    {sourceProxyUrls[index] ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            setViewerSourceUrl(sourceProxyUrls[index])
                            setViewerTitle(name)
                            setViewerOpen(true)
                          }}
                        >
                          <EyeIcon />
                          Открыть
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => triggerDownload(sourceProxyUrls[index], name)}
                        >
                          <DownloadSimpleIcon />
                          Скачать
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <TaskSourceViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        sourceFileUrl={viewerSourceUrl ?? openUrl}
        title={viewerTitle || (task.source === "file" ? fileNames[0] ?? `Исходник ${task.id}` : `${task.id}_input.txt`)}
      />
    </section>
  )
}
