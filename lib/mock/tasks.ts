import type { Task, TaskLogEntry, TaskSource, TaskStage, TaskStatus } from "@/lib/types"

const CADASTRAL_REGEX = /\b\d{2}:\d{2}:\d{6,}:\d{1,7}\b/g
const CADASTRAL_FLEX_REGEX = /\b(\d{2})[:\-\s_/](\d{2})[:\-\s_/](\d{6,})[:\-\s_/](\d{1,7})\b/g

let tasksStore: Task[] = [
  {
    id: "T-1001",
    title: "Парсинг участков Север",
    source: "file",
    sourceFileName: "north_district_batch_03.xlsx",
    sourceFileUrl: "/mock/sources/north_district_batch_03.xlsx",
    status: "processing",
    stage: "map_generation",
    createdBy: "Иван Петров",
    createdAt: "2026-03-31T08:20:00.000Z",
    updatedAt: "2026-03-31T08:23:00.000Z",
    cadastralNumbers: ["50:12:0000000:101", "50:12:0000000:102", "50:12:0000000:103"],
    processedCount: 2,
    successfulCount: 2,
    failedCount: 0,
    progress: 66,
    resultPreview: {
      sheets: [
        {
          name: "Результат",
          rows: [
            ["Кадастровый номер", "Статус", "Комментарий"],
            ["50:12:0000000:101", "OK", "Данные API получены"],
            ["50:12:0000000:102", "OK", "Карта построена"],
          ],
        },
      ],
    },
    errors: [],
    logs: [
      serverLog("2026-03-31T08:20:00.000Z", "info", "scheduler", "Задача принята в очередь", "queued"),
      serverLog(
        "2026-03-31T08:20:12.000Z",
        "info",
        "parser-worker-1",
        "Инициализация пайплайна обработки",
        "parsing"
      ),
      serverLog(
        "2026-03-31T08:20:28.000Z",
        "info",
        "validator",
        "Проверено 3/3 кадастровых номеров",
        "parsing"
      ),
      serverLog(
        "2026-03-31T08:21:01.000Z",
        "info",
        "rosreestr-api",
        "Запущен batch #1 (2 запроса)",
        "api_lookup"
      ),
      serverLog(
        "2026-03-31T08:21:19.000Z",
        "warning",
        "rosreestr-api",
        "429 Too Many Requests, retry через 800ms",
        "api_lookup"
      ),
      serverLog(
        "2026-03-31T08:21:20.000Z",
        "info",
        "retry-policy",
        "Повторный запрос batch #1 успешен",
        "api_lookup"
      ),
      serverLog(
        "2026-03-31T08:22:12.000Z",
        "info",
        "map-renderer",
        "Построено 2/3 карт (EPSG:3857)",
        "map_generation"
      ),
      serverLog(
        "2026-03-31T08:23:00.000Z",
        "info",
        "map-renderer",
        "Ожидание данных по последнему объекту",
        "map_generation"
      ),
    ],
  },
  {
    id: "T-1000",
    title: "Парсинг кадастров из текста",
    source: "text",
    sourceText: "77:01:0004012:3882\n77:01:0004012:3883",
    status: "completed",
    stage: "done",
    createdBy: "Анна Смирнова",
    createdAt: "2026-03-31T07:10:00.000Z",
    updatedAt: "2026-03-31T07:18:00.000Z",
    cadastralNumbers: ["77:01:0004012:3882", "77:01:0004012:3883"],
    processedCount: 2,
    successfulCount: 2,
    failedCount: 0,
    progress: 100,
    reportName: "report_T-1000.xlsx",
    resultFileUrl: "/mock/reports/report_T-1000.xlsx",
    resultPreview: {
      sheets: [
        {
          name: "Сводка",
          rows: [
            ["Кадастровый номер", "Площадь", "Координаты", "Статус"],
            ["77:01:0004012:3882", "734", "55.7522,37.6156", "OK"],
            ["77:01:0004012:3883", "810", "55.7526,37.6161", "OK"],
          ],
        },
      ],
    },
    errors: [],
    logs: [
      serverLog("2026-03-31T07:10:00.000Z", "info", "scheduler", "Задача принята в очередь", "queued"),
      serverLog(
        "2026-03-31T07:10:11.000Z",
        "info",
        "parser-worker-2",
        "Старт обработки входного текста",
        "parsing"
      ),
      serverLog(
        "2026-03-31T07:11:44.000Z",
        "info",
        "rosreestr-api",
        "Все API-запросы выполнены успешно",
        "api_lookup"
      ),
      serverLog(
        "2026-03-31T07:14:20.000Z",
        "info",
        "map-renderer",
        "Карты построены для 2 объектов",
        "map_generation"
      ),
      serverLog(
        "2026-03-31T07:17:58.000Z",
        "info",
        "excel-exporter",
        "Собрана книга Excel (листов: 3)",
        "excel_build"
      ),
      serverLog(
        "2026-03-31T07:18:00.000Z",
        "info",
        "storage",
        "Файл сохранен: report_T-1000.xlsx",
        "done"
      ),
    ],
  },
  {
    id: "T-999",
    title: "Парсинг проблемных объектов",
    source: "file",
    sourceFileName: "problem_objects.xlsx",
    sourceFileUrl: "/mock/sources/problem_objects.xlsx",
    status: "failed",
    stage: "error",
    createdBy: "Ольга Соколова",
    createdAt: "2026-03-31T06:45:00.000Z",
    updatedAt: "2026-03-31T06:52:00.000Z",
    cadastralNumbers: ["50:11:0010203:1001", "50:11:0010203:1002", "50:11:0010203:1003"],
    processedCount: 2,
    successfulCount: 2,
    failedCount: 1,
    progress: 80,
    reportName: "partial_report_T-999.xlsx",
    resultFileUrl: "/mock/reports/partial_report_T-999.xlsx",
    hasPartialResult: true,
    resultPreview: {
      sheets: [
        {
          name: "Частичный результат",
          rows: [
            ["Кадастровый номер", "Статус", "Комментарий"],
            ["50:11:0010203:1001", "OK", "Данные получены"],
            ["50:11:0010203:1002", "OK", "Данные получены"],
          ],
        },
      ],
    },
    errors: [{ cadastralNumber: "50:11:0010203:1003", message: "Не удалось построить карту" }],
    logs: [
      serverLog("2026-03-31T06:45:00.000Z", "info", "scheduler", "Задача принята в очередь", "queued"),
      serverLog(
        "2026-03-31T06:45:20.000Z",
        "info",
        "parser-worker-3",
        "Начат разбор входного файла",
        "parsing"
      ),
      serverLog(
        "2026-03-31T06:47:44.000Z",
        "info",
        "rosreestr-api",
        "Получены данные по 3/3 объектам",
        "api_lookup"
      ),
      serverLog(
        "2026-03-31T06:50:10.000Z",
        "warning",
        "map-renderer",
        "Tile service timeout, fallback на резервный слой",
        "map_generation"
      ),
      serverLog(
        "2026-03-31T06:52:00.000Z",
        "error",
        "map-renderer",
        "Ошибка при генерации карты",
        "map_generation",
        "50:11:0010203:1003"
      ),
      serverLog(
        "2026-03-31T06:52:01.000Z",
        "warning",
        "excel-exporter",
        "Сформирован частичный отчет по успешным объектам",
        "error"
      ),
    ],
  },
]

const nextStage: Record<TaskStage, TaskStage> = {
  queued: "parsing",
  parsing: "api_lookup",
  api_lookup: "map_generation",
  map_generation: "excel_build",
  excel_build: "done",
  done: "done",
  error: "error",
  stopped: "stopped",
}

const statusByStage: Record<TaskStage, TaskStatus> = {
  queued: "pending",
  parsing: "processing",
  api_lookup: "processing",
  map_generation: "processing",
  excel_build: "processing",
  done: "completed",
  error: "failed",
  stopped: "stopped",
}

const orderedStages: TaskStage[] = [
  "queued",
  "parsing",
  "api_lookup",
  "map_generation",
  "excel_build",
  "done",
]

function logEntry(
  at: string,
  level: TaskLogEntry["level"],
  message: string,
  stage?: TaskStage,
  cadastralNumber?: string
): TaskLogEntry {
  return { at, level, message, stage, cadastralNumber }
}

function serverLog(
  at: string,
  level: TaskLogEntry["level"],
  service: string,
  message: string,
  stage?: TaskStage,
  cadastralNumber?: string
): TaskLogEntry {
  return logEntry(at, level, `[${service}] ${message}`, stage, cadastralNumber)
}

function getProgressByStage(stage: TaskStage): number {
  const idx = orderedStages.indexOf(stage)
  if (idx < 0) return 0
  return Math.round((idx / (orderedStages.length - 1)) * 100)
}

function getNextTimestamp(baseIso: string, stepMinutes = 1): string {
  const base = new Date(baseIso)
  base.setMinutes(base.getMinutes() + stepMinutes)
  return base.toISOString()
}

export function extractCadastralNumbers(input: string): string[] {
  const strictMatches = input.match(CADASTRAL_REGEX) ?? []
  const normalizedFromFlexible = Array.from(
    input.matchAll(CADASTRAL_FLEX_REGEX),
    (match) => `${match[1]}:${match[2]}:${match[3]}:${match[4]}`
  )

  return [...new Set([...strictMatches, ...normalizedFromFlexible].map((value) => value.trim()))]
}

export function getTasks(): Task[] {
  return [...tasksStore].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getTaskById(id: string): Task | undefined {
  return tasksStore.find((task) => task.id === id)
}

export function createTask(params: {
  source: TaskSource
  numbers: string[]
  fileName?: string
  fileNames?: string[]
  rawInput?: string
}): Task {
  const now = new Date().toISOString()
  const nextId = `T-${1000 + tasksStore.length + 1}`
  const sourceFileNames =
    params.source === "file"
      ? params.fileNames && params.fileNames.length > 0
        ? params.fileNames
        : params.fileName
          ? [params.fileName]
          : []
      : []
  const sourceFileUrls = sourceFileNames.map(
    (name) => `/mock/sources/${encodeURIComponent(name)}`
  )

  const task: Task = {
    id: nextId,
    title: `Парсинг ${nextId}`,
    source: params.source,
    sourceText: params.source === "text" ? params.rawInput : undefined,
    sourceFileName: sourceFileNames[0],
    sourceFileUrl: sourceFileUrls[0],
    sourceFileNames: sourceFileNames.length > 0 ? sourceFileNames : undefined,
    sourceFileUrls: sourceFileUrls.length > 0 ? sourceFileUrls : undefined,
    status: "pending",
    stage: "queued",
    createdBy: "Текущий пользователь",
    createdAt: now,
    updatedAt: now,
    cadastralNumbers: params.numbers,
    processedCount: 0,
    successfulCount: 0,
    failedCount: 0,
    progress: 0,
    reportName: params.fileName ? `report_${nextId}.xlsx` : undefined,
    errors: [],
    logs: [
      serverLog(now, "info", "scheduler", "Задача зарегистрирована и поставлена в очередь", "queued"),
    ],
  }
  tasksStore = [task, ...tasksStore]
  return task
}

export function runTask(id: string): Task | undefined {
  const task = getTaskById(id)
  if (!task) return undefined

  const currentStage = task.stage === "stopped" ? "queued" : task.stage
  const newStage = nextStage[currentStage]
  task.stage = newStage
  task.status = statusByStage[newStage]
  task.updatedAt = getNextTimestamp(task.updatedAt, 1)
  task.progress = Math.max(task.progress, getProgressByStage(newStage))
  task.processedCount = Math.min(task.cadastralNumbers.length, task.processedCount + 1)
  task.successfulCount = Math.min(task.processedCount, task.successfulCount + 1)
  task.logs = task.logs ?? []
  const stageLogMessages: Partial<Record<TaskStage, string>> = {
    parsing: "Подготовка и валидация входных данных",
    api_lookup: "Запросы в API Росреестра запущены",
    map_generation: "Генерация карт и пространственных слоев",
    excel_build: "Сборка Excel-отчета",
    done: "Пайплайн завершен успешно",
  }
  const serviceByStage: Partial<Record<TaskStage, string>> = {
    parsing: "parser-worker",
    api_lookup: "rosreestr-api",
    map_generation: "map-renderer",
    excel_build: "excel-exporter",
    done: "storage",
  }
  task.logs.push(
    serverLog(
      task.updatedAt,
      "info",
      serviceByStage[newStage] ?? "pipeline",
      stageLogMessages[newStage] ?? `Этап: ${newStage}`,
      newStage
    )
  )

  const shouldFailOnMap = task.stage === "map_generation" && task.id.endsWith("3")
  if (shouldFailOnMap) {
    const failedNumber = task.cadastralNumbers[task.cadastralNumbers.length - 1]
    task.status = "failed"
    task.stage = "error"
    task.failedCount = 1
    task.hasPartialResult = true
    task.errors = [{ cadastralNumber: failedNumber, message: "Не удалось построить карту" }]
    task.logs.push(
      serverLog(
        task.updatedAt,
        "error",
        "map-renderer",
        "Критическая ошибка построения карты",
        "error",
        failedNumber
      )
    )
    task.reportName = `partial_report_${task.id}.xlsx`
    task.resultFileUrl = `/mock/reports/partial_report_${task.id}.xlsx`
    task.resultPreview = {
      sheets: [
        {
          name: "Частичный результат",
          rows: [
            ["Кадастровый номер", "Статус", "Комментарий"],
            ...task.cadastralNumbers
              .slice(0, Math.max(1, task.processedCount - 1))
              .map((value) => [value, "OK", "Данные получены"]),
          ],
        },
      ],
    }
    return { ...task }
  }

  if (task.stage === "done") {
    task.progress = 100
    task.processedCount = task.cadastralNumbers.length
    task.successfulCount = task.cadastralNumbers.length - task.failedCount
    task.reportName = task.reportName ?? `report_${task.id}.xlsx`
    task.resultFileUrl = task.resultFileUrl ?? `/mock/reports/report_${task.id}.xlsx`
    task.resultPreview = task.resultPreview ?? {
      sheets: [
        {
          name: "Результат",
          rows: [
            ["Кадастровый номер", "Статус", "Комментарий"],
            ...task.cadastralNumbers.map((value) => [value, "OK", "Обработано"]),
          ],
        },
      ],
    }
  }

  return { ...task }
}

export function stopTask(id: string): Task | undefined {
  const task = getTaskById(id)
  if (!task) return undefined
  task.status = "stopped"
  task.stage = "stopped"
  task.updatedAt = getNextTimestamp(task.updatedAt, 1)
  task.logs = task.logs ?? []
  task.logs.push(
    serverLog(
      task.updatedAt,
      "warning",
      "scheduler",
      "Задача остановлена оператором",
      "stopped"
    )
  )
  return { ...task }
}

export function deleteTask(id: string): boolean {
  const index = tasksStore.findIndex((task) => task.id === id)
  if (index < 0) return false
  tasksStore.splice(index, 1)
  return true
}

export function repeatTask(id: string): Task | undefined {
  const sourceTask = getTaskById(id)
  if (!sourceTask) return undefined

  return createTask({
    source: sourceTask.source,
    numbers: [...sourceTask.cadastralNumbers],
    fileName: sourceTask.sourceFileName,
    fileNames: sourceTask.sourceFileNames,
    rawInput: sourceTask.sourceText,
  })
}
