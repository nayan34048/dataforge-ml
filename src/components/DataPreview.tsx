import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { describeDataset } from '../utils/csv'
import { dropMissingRows, fillMissingValues } from '../utils/preprocessing'
import { Button, Card, SectionHeading, Callout, Badge } from './ui'

export function DataPreview() {
  const { dataset, setDataset, setStep } = useApp()
  const [showAllStats, setShowAllStats] = useState(false)
  const [prepChoice, setPrepChoice] = useState<'none' | 'drop' | 'fill'>('none')
  const [applied, setApplied] = useState(false)

  const missingColumns = useMemo(
    () => dataset?.analysis.columns.filter((c) => c.missingCount > 0) ?? [],
    [dataset]
  )

  if (!dataset) return null

  const applyPrep = () => {
    if (prepChoice === 'drop') setDataset(dropMissingRows(dataset))
    else if (prepChoice === 'fill') setDataset(fillMissingValues(dataset))
    setApplied(true)
  }

  const previewRows = dataset.rows.slice(0, 8)

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading
        eyebrow="Step 1 of 6 · My Data"
        title={dataset.name}
        description={describeDataset(dataset.analysis)}
      />

      <Card className="mb-6 overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark">
              {dataset.columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-2.5 font-medium text-ink-soft dark:text-mist-soft">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 dark:border-border-dark/60 last:border-0">
                {dataset.columns.map((c) => (
                  <td key={c} className="whitespace-nowrap px-4 py-2 text-ink dark:text-mist">
                    {row[c] === null ? <span className="text-clay">missing</span> : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border dark:border-border-dark px-4 py-2 text-xs text-ink-soft dark:text-mist-soft">
          Showing {previewRows.length} of {dataset.rows.length.toLocaleString()} rows
        </div>
      </Card>

      {missingColumns.length > 0 && !applied && (
        <div className="mb-6">
          <Callout tone="amber">
            <p className="mb-2 font-medium text-ink dark:text-mist">
              ⚠️ We found missing values in {missingColumns.length} column{missingColumns.length === 1 ? '' : 's'}:
            </p>
            <ul className="mb-3 list-inside list-disc space-y-0.5">
              {missingColumns.map((c) => (
                <li key={c.name}>
                  <strong>{c.name}</strong> has {c.missingCount} missing value{c.missingCount === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
            <p className="mb-3">You can remove these rows, or let us fill them using a recommended method.</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={prepChoice === 'fill' ? 'primary' : 'secondary'}
                onClick={() => setPrepChoice('fill')}
              >
                Fill missing values (recommended)
              </Button>
              <Button
                size="sm"
                variant={prepChoice === 'drop' ? 'primary' : 'secondary'}
                onClick={() => setPrepChoice('drop')}
              >
                Remove rows with missing values
              </Button>
            </div>
            {prepChoice !== 'none' && (
              <div className="mt-3 flex items-center gap-3">
                <p className="text-xs text-ink-soft dark:text-mist-soft">
                  {prepChoice === 'fill'
                    ? 'We will fill numbers with the typical (median) value and categories with the most common value.'
                    : `We will remove any row that has a missing value. This may remove up to ${dataset.analysis.totalMissingCells} affected rows.`}
                </p>
                <Button size="sm" onClick={applyPrep}>
                  Apply
                </Button>
              </div>
            )}
          </Callout>
        </div>
      )}

      {applied && (
        <div className="mb-6">
          <Callout tone="teal">Missing values handled. Your dataset now has {dataset.rows.length.toLocaleString()} rows.</Callout>
        </div>
      )}

      <button
        onClick={() => setShowAllStats((s) => !s)}
        className="mb-3 text-sm font-medium text-teal dark:text-amber hover:underline"
      >
        {showAllStats ? 'Hide detailed statistics' : 'View detailed statistics'}
      </button>

      {showAllStats && (
        <Card className="mb-8 overflow-x-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dataset.analysis.columns.map((c) => (
              <div key={c.name} className="rounded-md border border-border dark:border-border-dark p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-mono text-xs font-medium text-ink dark:text-mist">{c.name}</p>
                  <Badge tone={c.type === 'numeric' ? 'teal' : 'amber'}>{c.type}</Badge>
                </div>
                {c.type === 'numeric' ? (
                  <p className="text-xs text-ink-soft dark:text-mist-soft">
                    min {round(c.min)} · max {round(c.max)} · mean {round(c.mean)} · std {round(c.stdDev)}
                  </p>
                ) : (
                  <p className="text-xs text-ink-soft dark:text-mist-soft">
                    {c.uniqueCount} unique values
                    {c.topCategories?.[0] ? ` · most common: ${c.topCategories[0].value}` : ''}
                  </p>
                )}
                {c.missingCount > 0 && <p className="mt-1 text-xs text-clay">{c.missingCount} missing</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep('goal')}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function round(n?: number): string {
  if (n === undefined) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
