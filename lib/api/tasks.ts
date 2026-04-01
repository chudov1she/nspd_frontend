"use client"

import { API_BASE_URL, apiRequest } from "@/lib/api/client"
import { useAuthStore } from "@/lib/auth/store"
import type { Task } from "@/lib/types"

export type TaskSourcePreview = {
  count: number
  numbers: string[]
}

export function listTasks() {
  return apiRequest<Task[]>("/tasks", { method: "GET" })
}

export function createTaskFromText(sourceText: string) {
  const body = new FormData()
  body.append("source", "text")
  body.append("source_text", sourceText)
  return createTaskMultipart(body)
}

export function createTaskFromFiles(files: File[]) {
  const body = new FormData()
  body.append("source", "file")
  files.forEach((file) => body.append("files", file))
  return createTaskMultipart(body)
}

export async function previewTaskFiles(files: File[]): Promise<TaskSourcePreview> {
  const body = new FormData()
  files.forEach((file) => body.append("files", file))
  return previewTaskSource(body)
}

export async function previewTaskText(sourceText: string): Promise<TaskSourcePreview> {
  const body = new FormData()
  body.append("source_text", sourceText)
  return previewTaskSource(body)
}

async function createTaskMultipart(body: FormData): Promise<Task> {
  const { accessToken, logout } = useAuthStore.getState()
  const headers = new Headers()
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers,
    body,
  })

  if (response.status === 401) {
    logout()
    throw new Error("Unauthorized")
  }
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const json = (await response.json()) as { detail?: string }
      if (json?.detail) detail = json.detail
    } catch {}
    throw new Error(detail)
  }
  return (await response.json()) as Task
}

async function previewTaskSource(body: FormData): Promise<TaskSourcePreview> {
  const { accessToken, logout } = useAuthStore.getState()
  const headers = new Headers()
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE_URL}/tasks/preview`, {
    method: "POST",
    headers,
    body,
  })

  if (response.status === 401) {
    logout()
    throw new Error("Unauthorized")
  }
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const json = (await response.json()) as { detail?: string }
      if (json?.detail) detail = json.detail
    } catch {}
    throw new Error(detail)
  }
  return (await response.json()) as TaskSourcePreview
}

export function runTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/run`, { method: "POST" })
}

export function stopTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/stop`, { method: "POST" })
}

export function repeatTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/repeat`, { method: "POST" })
}

export function deleteTask(taskId: string) {
  return apiRequest<void>(`/tasks/${taskId}`, { method: "DELETE" })
}

export function tasksWebSocketUrl() {
  const { accessToken } = useAuthStore.getState()
  if (!accessToken) return null
  const wsBase = API_BASE_URL.replace(/^http/, "ws")
  return `${wsBase}/tasks/ws/tasks?token=${encodeURIComponent(accessToken)}`
}

export function tasksSocketIoConfig() {
  const { accessToken } = useAuthStore.getState()
  if (!accessToken) return null
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  return {
    origin,
    path: "/ws/socket.io",
    auth: { token: accessToken },
  }
}

export function getLatestApiBalance() {
  return apiRequest<{ balance: number | null }>("/tasks/api-balance", { method: "GET" })
}
