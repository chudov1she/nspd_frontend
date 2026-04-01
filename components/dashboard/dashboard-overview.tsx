"use client"

import * as React from "react"
import { io, type Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listTasks, tasksSocketIoConfig } from "@/lib/api/tasks"
import { useAuthStore } from "@/lib/auth/store"
import type { Task } from "@/lib/types"

export function DashboardOverview() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [tasks, setTasks] = React.useState<Task[]>([])

  React.useEffect(() => {
    void listTasks().then(setTasks).catch(() => {})
  }, [])

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
    const connectTimer = setTimeout(() => socket.connect(), 0)
    return () => {
      clearTimeout(connectTimer)
      socket.disconnect()
    }
  }, [accessToken])

  const cards = [
    { title: "В очереди", value: tasks.filter((task) => task.status === "pending").length },
    { title: "В работе", value: tasks.filter((task) => task.status === "processing").length },
    { title: "Завершено", value: tasks.filter((task) => task.status === "completed").length },
    { title: "Частично", value: tasks.filter((task) => task.status === "warning").length },
    { title: "С ошибкой", value: tasks.filter((task) => task.status === "failed").length },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
