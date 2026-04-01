"use client"

import * as React from "react"
import { toast } from "sonner"
import { z } from "zod"
import type { ColumnDef } from "@tanstack/react-table"
import { CaretRightIcon, CodeIcon, DownloadSimpleIcon, ListChecksIcon, PauseCircleIcon, XIcon } from "@phosphor-icons/react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogActions,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Task, TaskStage, TaskStatus } from "@/lib/types"
import { TaskDetailHeader } from "@/components/tasks/task-detail-header"
import { TaskSourcePanel } from "@/components/tasks/task-source-panel"
import { TaskProgressSummary } from "@/components/tasks/task-progress-summary"
import { TaskLogList } from "@/components/tasks/task-log-list"
import { TaskResultPanel } from "@/components/tasks/task-result-panel"
import { TaskStatusBadge } from "@/components/tasks/task-status-badge"

export const taskSchema = z.object({
  id: z.number(),
  taskId: z.string(),
  task: z.custom<Task>().optional(),
  header: z.string(),
  createdAt: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

export type TaskRow = z.infer<typeof taskSchema>
type TaskActions = {
  resolveTask?: (taskId: string, row: TaskRow) => Task | undefined
  onRun?: (taskId: string) => Promise<void>
  onStop?: (taskId: string) => Promise<void>
  onRepeat?: (taskId: string) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  isTaskOpen?: (taskId: string) => boolean
  setTaskOpen?: (taskId: string, open: boolean) => void
}

export const taskColumnLabels: Record<string, string> = {
  header: "Задача",
  createdAt: "Время создания",
  type: "Источник",
  status: "Статус",
  target: "Обработано",
  limit: "Всего",
}

const stageLabels: Record<TaskStage, string> = {
  queued: "В очереди",
  parsing: "Парсинг кадастровых номеров",
  api_lookup: "Сбор данных API",
  map_generation: "Генерация карты",
  excel_build: "Формирование Excel",
  done: "Завершено",
  error: "Ошибка",
  stopped: "Остановлено",
}

function mapDisplayStatusToTaskStatus(value: string): TaskStatus {
  if (value === "Готово") return "completed"
  if (value === "Предупреждение") return "warning"
  if (value === "На паузе") return "stopped"
  if (value === "Ошибка") return "failed"
  if (value === "В очереди") return "pending"
  return "processing"
}

function mapRowToTask(item: TaskRow, resolveTask?: (taskId: string, row: TaskRow) => Task | undefined): Task {
  if (item.task) return item.task
  const existingTask = resolveTask?.(item.taskId, item)
  if (existingTask) return existingTask

  const total = Number(item.limit) || 0
  const processed = Number(item.target) || 0
  const status: TaskStatus = mapDisplayStatusToTaskStatus(item.status)

  const stage: TaskStage =
    status === "completed"
      ? "done"
      : status === "failed"
        ? "error"
        : status === "stopped"
          ? "stopped"
          : processed >= total
            ? "excel_build"
            : "api_lookup"

  const now = new Date().toISOString()
  return {
    id: item.taskId,
    title: item.header,
    source: item.type.includes("Файл") ? "file" : "text",
    sourceFileName: item.type.includes("Файл")
      ? `source_T-${item.id}.xlsx`
      : undefined,
    sourceFileUrl: item.type.includes("Файл")
      ? `/mock/sources/source_T-${item.id}.xlsx`
      : undefined,
    sourceFileNames: item.type.includes("Файл")
      ? item.type.startsWith("Файлы (")
        ? Array.from({ length: Number(item.type.match(/\d+/)?.[0] ?? "1") }, (_, idx) => `source_T-${item.id}_${idx + 1}.xlsx`)
        : [`source_T-${item.id}.xlsx`]
      : undefined,
    sourceFileUrls: item.type.includes("Файл")
      ? item.type.startsWith("Файлы (")
        ? Array.from({ length: Number(item.type.match(/\d+/)?.[0] ?? "1") }, (_, idx) => `/mock/sources/source_T-${item.id}_${idx + 1}.xlsx`)
        : [`/mock/sources/source_T-${item.id}.xlsx`]
      : undefined,
    sourceText: item.type.includes("Файл")
      ? undefined
      : `Входные данные задачи ${item.header}: ${Math.max(processed, 1)} записей`,
    status,
    stage,
    createdBy: "Оператор",
    createdAt: now,
    updatedAt: now,
    cadastralNumbers: Array.from(
      { length: Math.max(total, 1) },
      (_, idx) => `Объект-${idx + 1}`
    ),
    processedCount: processed,
    successfulCount: Math.max(
      processed - (status === "failed" ? 1 : 0),
      0
    ),
    failedCount: status === "failed" || status === "warning" ? 1 : 0,
    progress:
      total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0,
    reportName:
      status === "completed" || status === "warning" || status === "failed"
        ? `report_T-${item.id}.xlsx`
        : undefined,
    hasPartialResult: status === "warning" || status === "failed",
    resultPreview:
      status === "completed" || status === "warning" || status === "failed"
        ? {
            sheets: [
              {
                name:
                  status === "warning" || status === "failed" ? "Частичный результат" : "Результат",
                rows: [
                  ["Объект", "Статус"],
                  ...Array.from({ length: Math.max(processed, 1) }, (_, idx) => [
                    `Объект-${idx + 1}`,
                    "OK",
                  ]),
                ],
              },
            ],
          }
        : undefined,
    errors:
      status === "failed" || status === "warning"
        ? [{ cadastralNumber: "Объект-1", message: "Ошибка обработки" }]
        : [],
    logs: [
      { at: now, level: "info", message: "Задача открыта в карточке", stage },
      ...(status === "failed" || status === "warning"
        ? [
            {
              at: now,
              level: status === "failed" ? ("error" as const) : ("warning" as const),
              message:
                status === "failed"
                  ? "Ошибка обработки при построении карты"
                  : "Часть объектов обработана с ошибками",
              stage: status === "failed" ? ("error" as TaskStage) : ("done" as TaskStage),
            },
          ]
        : []),
    ],
  }
}

function TaskCellViewer({ item, actions }: { item: TaskRow; actions?: TaskActions }) {
  const isMobile = useIsMobile()
  const task = mapRowToTask(item, actions?.resolveTask)
  const [localTaskOpen, setLocalTaskOpen] = React.useState(false)
  const [logsOpen, setLogsOpen] = React.useState(false)
  const taskOpen = actions?.isTaskOpen ? actions.isTaskOpen(task.id) : localTaskOpen
  const setTaskOpen = (open: boolean) => {
    if (actions?.setTaskOpen) {
      actions.setTaskOpen(task.id, open)
      return
    }
    setLocalTaskOpen(open)
  }

  const primaryAction = React.useMemo(() => {
    if (task.status === "completed" || task.status === "warning" || task.status === "failed") {
      return {
        label: "Повторить",
        icon: <ListChecksIcon />,
      }
    }
    if (task.status === "processing") {
      return {
        label: "Остановить",
        icon: <PauseCircleIcon />,
      }
    }
    return {
      label: "Возобновить",
      icon: <CaretRightIcon />,
    }
  }, [task.status])

  const logsText = React.useMemo(() => {
    const logs = [...(task.logs ?? [])]
    const levelLabel: Record<"info" | "warning" | "error", string> = {
      info: "INFO",
      warning: "WARN",
      error: "ERROR",
    }
    return logs
      .map(
        (log) =>
          `[${log.at}] [${levelLabel[log.level]}] ${log.message}${
            log.cadastralNumber ? ` (КН: ${log.cadastralNumber})` : ""
          }`
      )
      .join("\n")
  }, [task.logs])

  const logsDownloadUrl = React.useMemo(
    () =>
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        logsText || "Логи отсутствуют"
      )}`,
    [logsText]
  )

  async function handlePrimaryAction() {
    try {
      if (task.status === "completed" || task.status === "warning" || task.status === "failed") {
        if (!actions?.onRepeat) return
        await actions.onRepeat(task.id)
        toast.success(`Создана новая задача по ${task.id}`)
        return
      }

      if (task.status === "processing") {
        if (!actions?.onStop) return
        await actions.onStop(task.id)
        toast.success(`Задача ${task.id} остановлена`)
        return
      }

      if (!actions?.onRun) return
      await actions.onRun(task.id)
      toast.success(`Задача ${task.id} возобновлена`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выполнить действие")
    }
  }

  async function handleDeleteTask() {
    try {
      if (!actions?.onDelete) return
      await actions.onDelete(task.id)
      toast.success(`Задача ${task.id} удалена`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить задачу")
    }
  }

  const taskCardBody = (
    <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4 text-sm">
      <TaskDetailHeader task={task} />
      <TaskSourcePanel task={task} />
      <TaskProgressSummary task={task} stageLabels={stageLabels} />
      <TaskResultPanel task={task} />
    </div>
  )

  const taskCardActions = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handlePrimaryAction}>
          {primaryAction.icon}
          {primaryAction.label}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <XIcon />
              Удалить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
              <AlertDialogDescription>
                Задача {task.id} будет удалена без возможности восстановления.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogActions>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDeleteTask}>
                Удалить
              </AlertDialogAction>
            </AlertDialogActions>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Button variant="outline" onClick={() => setLogsOpen(true)}>
        <CodeIcon />
        Логи
      </Button>
    </>
  )

  return (
    <>
      {isMobile ? (
        <Drawer direction="bottom" open={taskOpen} onOpenChange={setTaskOpen}>
          <Button variant="link" className="w-fit px-0 text-left text-foreground" onClick={() => setTaskOpen(true)}>
            {item.header}
          </Button>
          <DrawerContent>
            <DrawerHeader className="gap-2">
              <div>
                <div>
                  <DrawerTitle>Карточка задачи</DrawerTitle>
                  <DrawerDescription>
                    Состояние выполнения, этапы и результаты
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            {taskCardBody}
            <DrawerFooter className="border-t">{taskCardActions}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={taskOpen} onOpenChange={setTaskOpen}>
          <Button variant="link" className="w-fit px-0 text-left text-foreground" onClick={() => setTaskOpen(true)}>
            {item.header}
          </Button>
          <SheetContent side="right" className="w-[40vw] max-w-none p-0">
            <SheetHeader className="gap-2 p-4">
              <div>
                <div>
                  <SheetTitle>Карточка задачи</SheetTitle>
                  <SheetDescription>
                    Состояние выполнения, этапы и результаты
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            {taskCardBody}
            <SheetFooter className="border-t p-4">{taskCardActions}</SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={logsOpen} onOpenChange={setLogsOpen}>
        <SheetContent className="w-screen max-w-none">
          <SheetHeader>
            <SheetTitle>Логи парсера</SheetTitle>
            <SheetDescription>
              Технические события выполнения задачи
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 p-4">
            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <a
                  href={logsDownloadUrl}
                  download={`${task.id}_parser_logs.txt`}
                >
                  <DownloadSimpleIcon />
                  Скачать логи
                </a>
              </Button>
            </div>
            <TaskLogList task={task} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function createTaskColumns(actions?: TaskActions): ColumnDef<TaskRow>[] {
  return [
  {
    accessorKey: "header",
    header: "Задача",
    cell: ({ row }) => <TaskCellViewer item={row.original} actions={actions} />,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Источник",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => (
      <TaskStatusBadge
        status={mapDisplayStatusToTaskStatus(row.original.status)}
      />
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="w-16 text-left">Обработано</div>,
    cell: ({ row }) => (
      <div className="w-16 text-left">{row.original.target}</div>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-16 text-left">Всего</div>,
    cell: ({ row }) => (
      <div className="w-16 text-left">{row.original.limit}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Время создания",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.createdAt}</span>
    ),
  },
  ]
}

export const taskColumns: ColumnDef<TaskRow>[] = createTaskColumns()
