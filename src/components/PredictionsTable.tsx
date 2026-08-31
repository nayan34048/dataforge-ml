import { useMemo, useState } from 'react'
import type { CellValue, TrainedModelResult } from '../types'
import { downloadTextFile, rowsToCsv } from '../utils/csv'
import { Button, Card, Callout } from './ui'

type SortDir = 'asc' | 'desc'

/** An interactive table of every held-out test row: its original feature values, the actual
 * value, and what the model predicted. Sortable, searchable, and downloadable as CSV — this is
 * the same information used to compute the metrics above, laid out row by row. */
export function PredictionsTable({ result }: { result: TrainedModelResult }) {
  const [search, setSearch] = useState('')
  const [onlyMistakes, setOnlyMistakes] = useState(false)
  const [sortKey, setSortKey] = useState<string>(result.taskType === 'regression' ? '__error' : '__actual')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const pageSize = 15

  const isRegression = result.taskType === 'regression'
  const testRows = result.testRows ?? []
  const actuals = result.actuals ?? []
  const predictions = result.predictions ?? []
  const featureColumns = result.featureColumns

  const rows = useMemo(() => {
    return testRows.map((row, i) => {
      const actual = actuals[i]
      const predicted = predictions[i]
      const error = isRegression && typeof actual === 'number' && typeof predicted === 'number' ? actual - predicted : null
      const correct = !isRegression ? actual === predicted : null
      return { row, actual, predicted, error, correct, idx: i }
    })
  }, [testRows, actuals, predictions, isRegression])

  const filtered = useMemo(() => {
    let out = rows
    if (onlyMistakes) {
      out = isRegression ? out.filter((r) => r.error !== null && Math.abs(r.error) > 0) : out.filter((r) => !r.correct)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      out = out.filter((r) => {
        const values = [...featureColumns.map((c) => r.row[c]), r.actual, r.predicted]
        return values.some((v) => String(v ?? '').toLowerCase().includes(q))
      })
    }
    const sorted = [...out].sort((a, b) => {
      const key = (r: (typeof rows)[number]): CellValue => {
        if (sortKey === '__actual') return r.actual ?? null
        if (sortKey === '__predicted') return r.predicted ?? null
        if (sortKey === '__error') return r.error
        return r.row[sortKey] ?? null
      }
      const av = key(a)
      const bv = key(b)
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [rows, onlyMistakes, search, sortKey, sortDir, featureColumns])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const handleDownload = () => {
    const exportRows = filtered.map((r) => {
      const out: Record<string, CellValue> = { ...r.row }
      out[`actual_${result.targetColumn ?? 'target'}`] = r.actual ?? null
      out[`predicted_${result.targetColumn ?? 'target'}`] = r.predicted ?? null
      if (isRegression) out.error = r.error
      else out.correct = r.correct
      return out
    })
    downloadTextFile(`${result.targetColumn ?? 'predictions'}_actual_vs_predicted.csv`, rowsToCsv(exportRows))
  }

  if (testRows.length === 0) {
    return (
      <Callout tone="amber">Row-level predictions aren't available for this result.</Callout>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink dark:text-mist">Actual vs. Predicted — every test row</p>
          <p className="text-xs text-ink-soft dark:text-mist-soft">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} rows shown. Click a column header to sort.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleDownload}>
          Download CSV
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search rows…"
          className="w-48 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-teal focus:outline-none dark:border-border-dark dark:text-mist dark:placeholder:text-mist-soft/50 dark:focus:border-amber"
        />
        <label className="flex items-center gap-1.5 text-sm text-ink-soft dark:text-mist-soft">
          <input
            type="checkbox"
            checked={onlyMistakes}
            onChange={(e) => {
              setOnlyMistakes(e.target.checked)
              setPage(0)
            }}
            className="accent-teal dark:accent-amber"
          />
          {isRegression ? 'Only rows with nonzero error' : 'Only misclassified rows'}
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border border-border dark:border-border-dark">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-paper-dim/60 dark:border-border-dark dark:bg-white/[0.03]">
              {featureColumns.map((c) => (
                <Th key={c} label={c} active={sortKey === c} dir={sortDir} onClick={() => toggleSort(c)} />
              ))}
              <Th label="Actual" active={sortKey === '__actual'} dir={sortDir} onClick={() => toggleSort('__actual')} />
              <Th label="Predicted" active={sortKey === '__predicted'} dir={sortDir} onClick={() => toggleSort('__predicted')} />
              {isRegression ? (
                <Th label="Error" active={sortKey === '__error'} dir={sortDir} onClick={() => toggleSort('__error')} />
              ) : (
                <th className="px-3 py-2 font-medium text-ink-soft dark:text-mist-soft">Match</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={r.idx}
                className={`border-b border-border/60 last:border-0 dark:border-border-dark/60 ${
                  isRegression
                    ? ''
                    : r.correct
                      ? ''
                      : 'bg-clay-soft/30 dark:bg-clay/10'
                }`}
              >
                {featureColumns.map((c) => (
                  <td key={c} className="whitespace-nowrap px-3 py-1.5 text-ink-soft dark:text-mist-soft">
                    {String(r.row[c] ?? '—')}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-ink dark:text-mist">{formatValue(r.actual)}</td>
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-ink dark:text-mist">{formatValue(r.predicted)}</td>
                {isRegression ? (
                  <td className="whitespace-nowrap px-3 py-1.5 text-ink-soft dark:text-mist-soft">
                    {r.error !== null ? r.error.toFixed(2) : '—'}
                  </td>
                ) : (
                  <td className="whitespace-nowrap px-3 py-1.5">{r.correct ? '✓' : '✗'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-ink-soft dark:text-mist-soft">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded px-2 py-1 hover:text-ink disabled:opacity-30 dark:hover:text-mist"
          >
            ← Previous
          </button>
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <button
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded px-2 py-1 hover:text-ink disabled:opacity-30 dark:hover:text-mist"
          >
            Next →
          </button>
        </div>
      )}
    </Card>
  )
}

function Th({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 font-medium text-ink-soft dark:text-mist-soft">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-ink dark:hover:text-mist">
        {label}
        {active && <span>{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}

function formatValue(v: CellValue | undefined): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return String(v)
}
