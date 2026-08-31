import Papa from 'papaparse'
import type { CellValue, ColumnSummary, Dataset, DatasetAnalysis } from '../types'

/** Parse a raw CSV string into a Dataset with automatic type + missing value analysis. */
export function parseCsvToDataset(name: string, csvText: string): Dataset {
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const columns = parsed.meta.fields ?? []
  const rawRows = parsed.data

  const rows: Record<string, CellValue>[] = rawRows.map((r) => {
    const row: Record<string, CellValue> = {}
    for (const col of columns) {
      const raw = r[col]
      row[col] = normalizeCell(raw)
    }
    return row
  })

  const analysis = analyzeDataset(columns, rows)

  return { name, columns, rows, analysis }
}

function normalizeCell(raw: string | undefined): CellValue {
  if (raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'na' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null') {
    return null
  }
  return trimmed
}

/** Decide whether a column is numeric or categorical, and compute summary stats. */
export function analyzeDataset(columns: string[], rows: Record<string, CellValue>[]): DatasetAnalysis {
  const columnSummaries: ColumnSummary[] = columns.map((col) => summarizeColumn(col, rows))

  const numericColumns = columnSummaries.filter((c) => c.type === 'numeric').map((c) => c.name)
  const categoricalColumns = columnSummaries.filter((c) => c.type === 'categorical').map((c) => c.name)
  const totalMissingCells = columnSummaries.reduce((sum, c) => sum + c.missingCount, 0)

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    numericColumns,
    categoricalColumns,
    columns: columnSummaries,
    hasMissingValues: totalMissingCells > 0,
    totalMissingCells,
  }
}

function summarizeColumn(name: string, rows: Record<string, CellValue>[]): ColumnSummary {
  const values = rows.map((r) => r[name])
  const nonMissing = values.filter((v) => v !== null) as (string | number)[]
  const missingCount = values.length - nonMissing.length

  const numericValues: number[] = []
  let numericLike = 0
  for (const v of nonMissing) {
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isNaN(n) && String(v).trim() !== '') {
      numericLike++
      numericValues.push(n)
    }
  }

  const isNumeric = nonMissing.length > 0 && numericLike / nonMissing.length >= 0.9

  const uniqueValues = new Set(nonMissing.map(String))

  if (isNumeric) {
    const sorted = [...numericValues].sort((a, b) => a - b)
    const mean = numericValues.reduce((a, b) => a + b, 0) / (numericValues.length || 1)
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
    const variance =
      numericValues.reduce((a, b) => a + (b - mean) ** 2, 0) / (numericValues.length || 1)
    return {
      name,
      type: 'numeric',
      missingCount,
      uniqueCount: uniqueValues.size,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median,
      stdDev: Math.sqrt(variance),
    }
  }

  const counts = new Map<string, number>()
  for (const v of nonMissing) {
    const key = String(v)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const topCategories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value, count]) => ({ value, count }))

  return {
    name,
    type: 'categorical',
    missingCount,
    uniqueCount: uniqueValues.size,
    topCategories,
  }
}

/** Returns a friendly, plain-language summary of a dataset. */
export function describeDataset(analysis: DatasetAnalysis): string {
  const parts: string[] = []
  parts.push(
    `Your dataset contains ${analysis.rowCount.toLocaleString()} rows and ${analysis.columnCount} columns.`
  )
  parts.push(
    `We found ${analysis.numericColumns.length} numerical column${analysis.numericColumns.length === 1 ? '' : 's'} and ${analysis.categoricalColumns.length} categorical column${analysis.categoricalColumns.length === 1 ? '' : 's'}.`
  )
  return parts.join(' ')
}

/** Converts an array of plain row objects into a CSV string. */
export function rowsToCsv(rows: Record<string, CellValue>[]): string {
  return Papa.unparse(rows)
}

/** Triggers a browser download of the given text content as a file. */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
