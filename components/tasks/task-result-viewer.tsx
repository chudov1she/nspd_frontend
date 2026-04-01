"use client"

import * as React from "react"
import * as XLSX from "xlsx"

import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL } from "@/lib/api/client"

type PreviewSheet = {
  name: string
  headers: string[]
  rows: string[][]
}

const EXACT_HEADERS = [
  "№",
  "Наименование",
  "Кадастровый номер",
  "Адрес (местоположение)",
  "Общая площадь, кв. м",
  "Категория",
  "Разрешенное использование",
  "Кадастровая стоимость",
  "Передаваемые права",
  "Правообладатель (собственник)",
  "Обременения (ограничения)",
  "Этаж",
  "Статус объекта",
  "Назначение",
  "Дата регистрации права",
  "Дата обновления информации",
  "Старый кадастровый номер",
  "Дата кадастровой стоимости",
  "Карта",
] as const

const HEADER_ALIASES: Record<string, string> = {
  "кадастровый номер": "Кадастровый номер",
  наименование: "Наименование",
  адрес: "Адрес (местоположение)",
  "адрес (местоположение)": "Адрес (местоположение)",
  площадь: "Общая площадь, кв. м",
  "общая площадь, кв. м": "Общая площадь, кв. м",
  категория: "Категория",
  "разрешенное использование": "Разрешенное использование",
  "кадастровая стоимость": "Кадастровая стоимость",
  права: "Передаваемые права",
  "передаваемые права": "Передаваемые права",
  правообладатель: "Правообладатель (собственник)",
  "правообладатель (собственник)": "Правообладатель (собственник)",
  обременения: "Обременения (ограничения)",
  "обременения (ограничения)": "Обременения (ограничения)",
  этаж: "Этаж",
  статус: "Статус объекта",
  "статус объекта": "Статус объекта",
  назначение: "Назначение",
  "дата регистрации права": "Дата регистрации права",
  "дата обновления информации": "Дата обновления информации",
  "старый кадастровый номер": "Старый кадастровый номер",
  "дата кадастровой стоимости": "Дата кадастровой стоимости",
  карта: "Карта",
}

function normalizeHeader(value: string, index: number): string {
  const raw = (value ?? "").trim()
  if (!raw) return EXACT_HEADERS[index] ?? `Колонка ${index + 1}`
  const key = raw.toLowerCase()
  return HEADER_ALIASES[key] ?? raw
}

const COLUMN_WIDTHS: Record<string, string> = {
  "№": "72px",
  "Наименование": "220px",
  "Кадастровый номер": "220px",
  "Адрес (местоположение)": "520px",
  "Общая площадь, кв. м": "170px",
  Категория: "220px",
  "Разрешенное использование": "280px",
  "Кадастровая стоимость": "190px",
  "Передаваемые права": "340px",
  "Правообладатель (собственник)": "300px",
  "Обременения (ограничения)": "320px",
  Этаж: "90px",
  "Статус объекта": "160px",
  Назначение: "220px",
  "Дата регистрации права": "170px",
  "Дата обновления информации": "200px",
  "Старый кадастровый номер": "260px",
  "Дата кадастровой стоимости": "200px",
  Карта: "260px",
}

function getColumnWidth(header: string | undefined): string {
  if (!header) return "180px"
  return COLUMN_WIDTHS[header.trim()] ?? "180px"
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function isMapPresentMarker(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return normalized === "да" || normalized === "yes" || normalized === "true" || normalized === "1" || normalized === "+"
}

function toMapProxyUrl(taskId: string, rawUrl: string): string {
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  try {
    const parsed = new URL(rawUrl)
    const match = parsed.pathname.match(/\/tasks\/([^/]+)\/result\/maps\/([^/?#]+)/i)
    if (!match) return rawUrl
    const sourceTaskId = decodeURIComponent(match[1])
    const mapName = decodeURIComponent(match[2])
    return `${origin}/api/v1/tasks/${encodeURIComponent(sourceTaskId || taskId)}/maps/${encodeURIComponent(mapName)}`
  } catch {
    return rawUrl
  }
}

function parseCsv(content: string, maxRows = 100): PreviewSheet[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxRows + 1)

  if (lines.length === 0) return [{ name: "CSV", headers: [], rows: [] }]
  const parsed = lines.map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "")))
  const [headers, ...rows] = parsed
  return [{ name: "CSV", headers: headers.map((header, idx) => normalizeHeader(header, idx)), rows }]
}

function parseWorkbook(buffer: ArrayBuffer, maxRows = 100): PreviewSheet[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  if (workbook.SheetNames.length === 0) return [{ name: "Лист 1", headers: [], rows: [] }]

  return workbook.SheetNames.slice(0, 5).map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      raw: false,
      blankrows: false,
    }) as Array<Array<string | number | null>>

    const normalized = data
      .slice(0, maxRows + 1)
      .map((row) => row.map((cell) => (cell == null ? "" : String(cell))))
    const [headers = [], ...rows] = normalized
    return { name: sheetName, headers: headers.map((header, idx) => normalizeHeader(header, idx)), rows }
  })
}

export function TaskResultViewer({
  open,
  onOpenChange,
  resultFileUrl,
  title,
  taskId,
  mapImageByCadastral = {},
  previewData,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  resultFileUrl?: string
  title: string
  taskId: string
  mapImageByCadastral?: Record<string, string>
  previewData?: { sheets: Array<{ name: string; rows: string[][] }> }
}) {
  const [previewSheets, setPreviewSheets] = React.useState<PreviewSheet[]>([])
  const [activeSheet, setActiveSheet] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    if (previewData?.sheets?.length) {
      const data: PreviewSheet[] = previewData.sheets.map((sheet) => {
        const [headers = [], ...rows] = sheet.rows ?? []
        return {
          name: sheet.name || "Результат",
          headers: headers.map((header, idx) => normalizeHeader(String(header ?? ""), idx)),
          rows: rows.map((row) => row.map((cell) => String(cell ?? ""))),
        }
      })
      setPreviewSheets(data)
      setActiveSheet(data[0]?.name ?? "")
      setError(null)
      setIsLoading(false)
      return
    }
    if (!resultFileUrl) return

    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(resultFileUrl)
        if (!response.ok) throw new Error("not found")

        const data = resultFileUrl.endsWith(".csv")
          ? parseCsv(await response.text())
          : parseWorkbook(await response.arrayBuffer())
        if (!cancelled) {
          setPreviewSheets(data)
          setActiveSheet(data[0]?.name ?? "")
        }
      } catch {
        if (!cancelled) {
          setPreviewSheets([])
          setError("Не удалось загрузить файл результата для превью.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, previewData, resultFileUrl])

  const currentSheet = previewSheets.find((sheet) => sheet.name === activeSheet) ?? previewSheets[0]
  const filteredRows = React.useMemo(() => {
    if (!currentSheet) return []
    if (!search.trim()) return currentSheet.rows
    const query = search.toLowerCase()
    return currentSheet.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query))
    )
  }, [currentSheet, search])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-screen data-[side=right]:max-w-none">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Визуализация данных результата</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          {isLoading ? <p className="text-xs text-muted-foreground">Загрузка результата...</p> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          {currentSheet ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по таблице..."
                  className="h-8 w-full max-w-xs bg-background"
                />
                <span className="text-xs text-muted-foreground">
                  Строк: {filteredRows.length}
                </span>
              </div>

              <Tabs value={activeSheet} onValueChange={setActiveSheet} className="w-full gap-2">
                <TabsList>
                  {previewSheets.map((sheet) => (
                    <TabsTrigger key={sheet.name} value={sheet.name}>
                      {sheet.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {previewSheets.map((sheet) => (
                  <TabsContent key={sheet.name} value={sheet.name}>
                    <div className="max-h-[72vh] overflow-auto rounded border bg-background">
                      <table className="table-fixed text-xs" style={{ minWidth: "4600px" }}>
                        <colgroup>
                          {sheet.headers.map((header, idx) => (
                            <col key={`col-${idx}`} style={{ width: getColumnWidth(header) }} />
                          ))}
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                          <tr className="border-b">
                            {sheet.headers.map((header, idx) => (
                              <th key={`h-${idx}`} className="px-2 py-1 text-left font-medium whitespace-nowrap">
                                {header || `Колонка ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(sheet.name === currentSheet.name ? filteredRows : sheet.rows).map((row, rowIdx) => (
                            <tr
                              key={`r-${rowIdx}`}
                              className="border-b last:border-b-0 odd:bg-muted/20"
                            >
                              {sheet.headers.map((_, cellIdx) => {
                                const cell = row[cellIdx] ?? ""
                                const mapColIdx = sheet.headers.findIndex((h) => h?.trim() === "Карта")
                                const cadColIdx = sheet.headers.findIndex((h) => h?.trim() === "Кадастровый номер")
                                const isMapCell = cellIdx === mapColIdx && mapColIdx >= 0
                                if (isMapCell) {
                                  const cadastral = cadColIdx >= 0 ? (row[cadColIdx] ?? "").trim() : ""
                                  const fallbackCellUrl = isHttpUrl(cell) ? cell.trim() : undefined
                                  const markerPresent = isMapPresentMarker(cell)
                                  const mapUrlRaw =
                                    fallbackCellUrl
                                    ?? (markerPresent && cadastral ? mapImageByCadastral[cadastral] : undefined)
                                  const mapUrl = mapUrlRaw ? toMapProxyUrl(taskId, mapUrlRaw) : undefined
                                  return (
                                    <td key={`c-${rowIdx}-${cellIdx}`} className="px-2 py-1 align-top">
                                      {mapUrl ? (
                                        <img
                                          src={mapUrl}
                                          alt={`Карта ${cadastral}`}
                                          className="h-auto w-[220px] rounded border object-contain"
                                          loading="lazy"
                                          onError={(event) => {
                                            event.currentTarget.style.display = "none"
                                          }}
                                        />
                                      ) : (
                                        cell
                                      )}
                                    </td>
                                  )
                                }
                                return (
                                  <td
                                    key={`c-${rowIdx}-${cellIdx}`}
                                    className="px-2 py-1 align-top break-words whitespace-pre-wrap"
                                  >
                                    {cell}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
