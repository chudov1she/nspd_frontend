"use client"

import * as React from "react"
import { io, type Socket } from "socket.io-client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { createTaskColumns, taskColumnLabels } from "@/components/tasks/tasks-columns"
import { deleteTask, listTasks, repeatTask, runTask, stopTask, tasksSocketIoConfig } from "@/lib/api/tasks"
import { useAuthStore } from "@/lib/auth/store"
import type { Task } from "@/lib/types"

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

export function DashboardLatestTasks() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null)

  const refreshTasks = React.useCallback(async () => {
    const data = await listTasks()
    setTasks(data)
  }, [])

  React.useEffect(() => {
    void refreshTasks().catch(() => {})
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
      if (Array.isArray(payload.tasks)) setTasks(payload.tasks)
    })
    const connectTimer = setTimeout(() => {
      socket.connect()
    }, 0)

    return () => {
      clearTimeout(connectTimer)
      socket.disconnect()
    }
  }, [accessToken])

  const latestTasks = tasks.slice(0, 5)
  const tableData = latestTasks.map((task, index) => ({
    id: Number(task.id.replace("T-", "")) || index + 1,
    taskId: task.id,
    task,
    header: task.title,
    createdAt: formatServerDate(task.createdAt),
    type: task.source === "file" ? "Файл" : "Текст",
    status:
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
              : "В работе",
    target: String(task.processedCount),
    limit: String(task.cadastralNumbers.length),
    reviewer: task.createdBy ?? "Не назначен",
  }))
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
    <Card>
      <CardHeader>
        <CardTitle>Последние задачи</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={tableData}
          columns={columns}
          columnLabels={taskColumnLabels}
          addHref="/tasks"
          addLabel="Добавить задачу"
          enableDragDrop
        />
      </CardContent>
    </Card>
  )
}
