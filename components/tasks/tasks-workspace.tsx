"use client"

import * as React from "react"
import { io, type Socket } from "socket.io-client"
import { PlusIcon, SpinnerIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createTaskFromFiles, createTaskFromText, deleteTask, listTasks, previewTaskFiles, repeatTask, runTask, stopTask, tasksSocketIoConfig } from "@/lib/api/tasks"
import { useAuthStore } from "@/lib/auth/store"
import type { Task } from "@/lib/types"
import { DataTable } from "@/components/data-table"
import { createTaskColumns, taskColumnLabels } from "@/components/tasks/tasks-columns"
import { playNotificationSound } from "@/lib/notifications/sound"

type CreateSourceMode = "text" | "file"
const CADASTRAL_REGEX = /\b\d{2}:\d{2}:\d{6,}:\d{1,7}\b/g
const CADASTRAL_FLEX_REGEX = /\b(\d{2})[:\-\s_/](\d{2})[:\-\s_/](\d{6,})[:\-\s_/](\d{1,7})\b/g

function extractCadastralNumbers(input: string): string[] {
  const strictMatches = input.match(CADASTRAL_REGEX) ?? []
  const normalized = Array.from(input.matchAll(CADASTRAL_FLEX_REGEX), (m) => `${m[1]}:${m[2]}:${m[3]}:${m[4]}`)
  return [...new Set([...strictMatches, ...normalized].map((v) => v.trim()))]
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

export function TasksWorkspace() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [textInput, setTextInput] = React.useState("")
  const [sourceMode, setSourceMode] = React.useState<CreateSourceMode>("text")
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [fileNumbers, setFileNumbers] = React.useState<string[]>([])
  const [isParsingFile, setIsParsingFile] = React.useState(false)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isCreatingTask, setIsCreatingTask] = React.useState(false)
  const createCardRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const textNumbersPreview = React.useMemo(
    () => extractCadastralNumbers(textInput),
    [textInput]
  )
  const hasLoadedRef = React.useRef(false)
  const statusByTaskRef = React.useRef<Map<string, Task["status"]>>(new Map())
  const snapshotInitializedRef = React.useRef(false)

  const refreshTasks = React.useCallback(async () => {
    const data = await listTasks()
    setTasks(data)
  }, [])

  React.useEffect(() => {
    void refreshTasks()
      .catch(() => toast.error("Не удалось загрузить задачи"))
      .finally(() => {
        setLoading(false)
        hasLoadedRef.current = true
      })
  }, [refreshTasks])

  React.useEffect(() => {
    if (!accessToken) return
    const config = tasksSocketIoConfig()
    if (!config) return
    const socket: Socket = io(config.origin, {
      path: config.path,
      auth: config.auth,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000,
    })
    socket.on("tasks_snapshot", (payload: { tasks?: Task[] }) => {
      if (!Array.isArray(payload.tasks)) return
      const nextMap = new Map<string, Task["status"]>()
      payload.tasks.forEach((task) => {
        nextMap.set(task.id, task.status)
        const prev = statusByTaskRef.current.get(task.id)
        if (!hasLoadedRef.current || !snapshotInitializedRef.current || prev === task.status) return
        if (task.status === "completed") {
          playNotificationSound()
          toast.success(`${task.title} завершена`)
        }
        if (task.status === "warning") {
          playNotificationSound()
          toast.warning(`${task.title} завершена частично`)
        }
        if (task.status === "failed") {
          playNotificationSound()
          toast.error(`${task.title} завершилась с ошибкой`)
        }
      })
      snapshotInitializedRef.current = true
      statusByTaskRef.current = nextMap
      setTasks(payload.tasks)
    })

    const connectTimer = setTimeout(() => {
      socket.connect()
    }, 0)

    return () => {
      clearTimeout(connectTimer)
      socket.disconnect()
    }
  }, [accessToken])

  React.useEffect(() => {
    if (!openTaskId) return
    if (!tasks.some((task) => task.id === openTaskId)) {
      setOpenTaskId(null)
    }
  }, [openTaskId, tasks])

  async function processSelectedFiles(files: File[]) {
    if (files.length === 0) return

    setSelectedFiles(files)
    setIsParsingFile(true)
    try {
      const preview = await previewTaskFiles(files)
      setFileNumbers(preview.numbers)
      toast.success(`Найдено кадастров: ${preview.count}`)
    } catch {
      setFileNumbers([])
      toast.error("Не удалось разобрать файлы")
    } finally {
      setIsParsingFile(false)
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    await processSelectedFiles(Array.from(event.target.files ?? []))
  }

  function handleClearFile() {
    setSelectedFiles([])
    setFileNumbers([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleCreateTask() {
    if (isCreatingTask) return
    try {
      setOpenTaskId(null)
      if (sourceMode === "text") {
        const numbers = extractCadastralNumbers(textInput)
        if (numbers.length === 0) {
          toast.error("В тексте не найдены кадастровые номера")
          return
        }

        setIsCreatingTask(true)
        const created = await createTaskFromText(textInput)
        setTextInput("")
        setOpenTaskId(null)
        await refreshTasks()
        toast.success(`Задача ${created.id} добавлена`)
        return
      }

      if (selectedFiles.length === 0) {
        toast.error("Сначала выберите хотя бы один файл")
        return
      }
      if (fileNumbers.length === 0) {
        toast.error("В файле не найдено кадастров")
        return
      }

      setIsCreatingTask(true)
      const created = await createTaskFromFiles(selectedFiles)
      setOpenTaskId(null)
      await refreshTasks()
      handleClearFile()
      toast.success(`Задача ${created.id} добавлена`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать задачу")
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const files = Array.from(event.dataTransfer.files ?? [])
    await processSelectedFiles(files)
  }

  const filteredTasks = tasks.filter((task) => {
    const haystack = `${task.id} ${task.title} ${task.cadastralNumbers.join(" ")}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })
  const tableData = filteredTasks.map((task, index) => {
    const status =
      task.status === "completed"
        ? "Готово"
        : task.status === "warning"
          ? "Предупреждение"
        : task.status === "failed"
          ? "Ошибка"
          : task.status === "stopped"
            ? "На паузе"
            : task.status === "pending"
              ? "В очереди"
              : "В работе"
    return {
      id: Number(task.id.replace("T-", "")) || index + 1,
      taskId: task.id,
      task,
      header: task.title,
      createdAt: formatServerDate(task.createdAt),
      type:
        task.source === "file"
          ? task.sourceFileNames && task.sourceFileNames.length > 1
            ? `Файлы (${task.sourceFileNames.length})`
            : "Файл"
          : "Текст",
      status,
      target: String(task.processedCount),
      limit: String(task.cadastralNumbers.length),
      reviewer: task.createdBy ?? "Не назначен",
    }
  })
  const columns = React.useMemo(
    () =>
      createTaskColumns({
        isTaskOpen: (taskId) => openTaskId === taskId,
        setTaskOpen: (taskId, open) => {
          setOpenTaskId((prev) => {
            if (open) return taskId
            return prev === taskId ? null : prev
          })
        },
        onRun: async (taskId) => {
          await runTask(taskId)
          await refreshTasks()
        },
        onStop: async (taskId) => {
          await stopTask(taskId)
          await refreshTasks()
        },
        onRepeat: async (taskId) => {
          await repeatTask(taskId)
          await refreshTasks()
        },
        onDelete: async (taskId) => {
          await deleteTask(taskId)
          await refreshTasks()
        },
      }),
    [openTaskId, refreshTasks]
  )

  return (
    <div className="space-y-4">
      <Card ref={createCardRef}>
        <CardHeader>
          <CardTitle>Создать задачу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={sourceMode}
            onValueChange={(value) => setSourceMode(value as CreateSourceMode)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Ввод текстом</TabsTrigger>
              <TabsTrigger value="file">Загрузка файла</TabsTrigger>
            </TabsList>
          </Tabs>

          {sourceMode === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="task-text">Кадастровые номера</Label>
              <textarea
                id="task-text"
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                placeholder="Поддерживаются форматы: 77:01:0004012:3882, 77-01-0004012-3882, в столбик, через запятую и т.д."
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Найдено кадастров: {textNumbersPreview.length}
              </p>
              {textNumbersPreview.length > 0 ? (
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Обнаруженные кадастровые номера
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {textNumbersPreview.map((number) => (
                      <span
                        key={number}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="task-file">Файл с кадастрами</Label>
              <input
                id="task-file"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.ods,.csv,.txt,.json,.xml,.md,.log"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setIsDragActive(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragActive(true)
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  setIsDragActive(false)
                }}
                onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
                }`}
              >
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border bg-background">
                  <UploadSimpleIcon className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Excel, ODS, CSV, TXT, JSON, XML и другие текстовые форматы
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedFiles.length > 0 ? (
                  <>
                    Файлов: {selectedFiles.length} • кадастров: {fileNumbers.length}
                    {isParsingFile ? " (анализ...)" : ""}
                  </>
                ) : (
                  "Поддержка: Excel, ODS, CSV, TXT, JSON, XML и другие текстовые форматы"
                )}
              </div>
              {selectedFiles.length > 0 ? (
                <Button variant="outline" size="sm" onClick={handleClearFile}>
                  Очистить файл
                </Button>
              ) : null}
              {selectedFiles.length > 0 ? (
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Загруженные файлы
                  </p>
                  <ul className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="text-xs">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {fileNumbers.length > 0 ? (
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Обнаруженные кадастровые номера
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fileNumbers.map((number) => (
                      <span
                        key={number}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => void handleCreateTask()}
              disabled={loading || isCreatingTask}
            >
              {isCreatingTask ? <SpinnerIcon className="animate-spin" /> : <PlusIcon />}
              {isCreatingTask ? "Создание..." : "Добавить задачу"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Задачи</CardTitle>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по ID задачи или кадастровому номеру"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={tableData}
            columns={columns}
            columnLabels={taskColumnLabels}
          />
        </CardContent>
      </Card>
    </div>
  )
}
