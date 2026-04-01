export type TaskStatus = "pending" | "processing" | "completed" | "warning" | "failed" | "stopped"

export type TaskStage =
  | "queued"
  | "parsing"
  | "api_lookup"
  | "map_generation"
  | "excel_build"
  | "done"
  | "error"
  | "stopped"

export type TaskSource = "text" | "file"

export type TaskError = {
  cadastralNumber: string
  message: string
}

export type TaskLogLevel = "info" | "warning" | "error"

export type TaskLogEntry = {
  at: string
  level: TaskLogLevel
  message: string
  stage?: TaskStage
  cadastralNumber?: string
}

export type TaskResultPreviewSheet = {
  name: string
  rows: string[][]
}

export type TaskResultPreview = {
  sheets: TaskResultPreviewSheet[]
}

export type Task = {
  id: string
  source: TaskSource
  sourceText?: string
  sourceFileName?: string
  sourceFileUrl?: string
  sourceFileNames?: string[]
  sourceFileUrls?: string[]
  status: TaskStatus
  stage: TaskStage
  title: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  cadastralNumbers: string[]
  processedCount: number
  successfulCount: number
  failedCount: number
  progress: number
  reportName?: string
  resultFileUrl?: string
  hasPartialResult?: boolean
  resultPreview?: TaskResultPreview
  errors: TaskError[]
  logs?: TaskLogEntry[]
}

export type SystemUser = {
  id: string
  name: string
  email: string
  lastSeenAt: string | null
}
