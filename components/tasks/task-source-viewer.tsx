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

type PreviewSheet = {
  name: string
  headers: string[]
  rows: string[][]
}

function parseCsv(content: string, maxRows = 100): PreviewSheet[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxRows + 1)
  if (lines.length === 0) return [{ name: "CSV", headers: [], rows: [] }]
  const parsed = lines.map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "")))
  const [headers = [], ...rows] = parsed
  return [{ name: "CSV", headers, rows }]
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
    return { name: sheetName, headers, rows }
  })
}

function extensionOf(url: string): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname
    const dot = pathname.lastIndexOf(".")
    return dot >= 0 ? pathname.slice(dot).toLowerCase() : ""
  } catch {
    return ""
  }
}

export function TaskSourceViewer({
  open,
  onOpenChange,
  sourceFileUrl,
  title,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  sourceFileUrl?: string
  title: string
}) {
  const [previewSheets, setPreviewSheets] = React.useState<PreviewSheet[]>([])
  const [activeSheet, setActiveSheet] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !sourceFileUrl) return
    let cancelled = false

    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(sourceFileUrl)
        if (!response.ok) throw new Error("not found")
        const ext = extensionOf(sourceFileUrl)
        let parsed: PreviewSheet[]
        if (ext === ".csv") {
          parsed = parseCsv(await response.text())
        } else if ([".xlsx", ".xls", ".ods"].includes(ext)) {
          parsed = parseWorkbook(await response.arrayBuffer())
        } else {
          const text = await response.text()
          parsed = [{ name: "Текст", headers: ["Содержимое"], rows: text.split(/\r?\n/).slice(0, 200).map((line) => [line]) }]
        }
        if (!cancelled) {
          setPreviewSheets(parsed)
          setActiveSheet(parsed[0]?.name ?? "")
        }
      } catch {
        if (!cancelled) {
          setPreviewSheets([])
          setError("Не удалось загрузить исходный файл для превью.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, sourceFileUrl])

  const currentSheet = previewSheets.find((sheet) => sheet.name === activeSheet) ?? previewSheets[0]
  const filteredRows = React.useMemo(() => {
    if (!currentSheet) return []
    if (!search.trim()) return currentSheet.rows
    const query = search.toLowerCase()
    return currentSheet.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(query)))
  }, [currentSheet, search])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-screen data-[side=right]:max-w-none">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Визуализация исходного файла</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          {isLoading ? <p className="text-xs text-muted-foreground">Загрузка исходника...</p> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {currentSheet ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по исходнику..."
                  className="h-8 w-full max-w-xs bg-background"
                />
                <span className="text-xs text-muted-foreground">Строк: {filteredRows.length}</span>
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
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                          <tr className="border-b">
                            {sheet.headers.map((header, idx) => (
                              <th key={`h-${idx}`} className="px-2 py-1 text-left font-medium">
                                {header || `Колонка ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(sheet.name === currentSheet.name ? filteredRows : sheet.rows).map((row, rowIdx) => (
                            <tr key={`r-${rowIdx}`} className="border-b last:border-b-0 odd:bg-muted/20">
                              {row.map((cell, cellIdx) => (
                                <td key={`c-${rowIdx}-${cellIdx}`} className="px-2 py-1 align-top">
                                  {cell}
                                </td>
                              ))}
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
