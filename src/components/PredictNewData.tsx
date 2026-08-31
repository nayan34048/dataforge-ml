import { useRef, useState } from 'react'
import type { CellValue, TrainedModelResult } from '../types'
import { downloadTextFile, parseCsvToDataset, rowsToCsv } from '../utils/csv'
import { Button, Card, Callout, SectionHeading } from './ui'

/** Lets the user upload a second CSV (new, unlabeled data) and apply the already-trained
 * model to it — using the exact same encoding and scaling the model was trained with. */
export function PredictNewData({ result }: { result: TrainedModelResult }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Record<string, CellValue>[] | null>(null)
  const [predictions, setPredictions] = useState<(number | string)[] | null>(null)
  const [unmatched, setUnmatched] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  if (!result.predictOnNewData) {
    return (
      <Callout tone="amber">
        Applying this model to new data isn't available for this result. Train a prediction model (not a Python-code
        model) to unlock this.
      </Callout>
    )
  }

  const loadFile = (file: File) => {
    setError(null)
    setPredictions(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        const dataset = parseCsvToDataset(file.name.replace(/\.csv$/i, ''), text)
        if (dataset.rows.length === 0) {
          setError("We couldn't find any rows in that file.")
          return
        }
        setFileName(file.name)
        setRows(dataset.rows)
      } catch {
        setError('Something went wrong reading that file. Please check it is a valid CSV.')
      }
    }
    reader.onerror = () => setError('We could not read that file. Please try again.')
    reader.readAsText(file)
  }

  const runPrediction = () => {
    if (!rows || !result.predictOnNewData) return
    try {
      const { predictions: preds, unmatchedColumns } = result.predictOnNewData(rows)
      setPredictions(preds)
      setUnmatched(unmatchedColumns)
    } catch (e) {
      setError(e instanceof Error ? `Couldn't generate predictions: ${e.message}` : "Couldn't generate predictions.")
    }
  }

  const handleDownload = () => {
    if (!rows || !predictions) return
    const outCol = `predicted_${result.targetColumn ?? 'target'}`
    const exportRows = rows.map((row, i) => ({ ...row, [outCol]: predictions[i] ?? null }))
    downloadTextFile(`${fileName?.replace(/\.csv$/i, '') ?? 'new_data'}_predictions.csv`, rowsToCsv(exportRows))
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Predict on new data"
        description={`Upload another spreadsheet with the same columns (it doesn't need a "${result.targetColumn}" column) and this trained model will fill it in.`}
      />

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Choose CSV file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) loadFile(file)
            }}
          />
          {fileName && <span className="text-sm text-ink-soft dark:text-mist-soft">{fileName} — {rows?.length.toLocaleString()} rows</span>}
        </div>

        {error && (
          <div className="mb-4">
            <Callout tone="clay">{error}</Callout>
          </div>
        )}

        {rows && (
          <Button onClick={runPrediction} disabled={!rows}>
            Predict {result.targetColumn ? `"${result.targetColumn}"` : ''} for these rows
          </Button>
        )}

        {unmatched.length > 0 && predictions && (
          <div className="mt-4">
            <Callout tone="amber">
              This file is missing column{unmatched.length > 1 ? 's' : ''} the model expects: {unmatched.join(', ')}.
              We filled those in with a neutral default, so treat these predictions as approximate.
            </Callout>
          </div>
        )}

        {predictions && rows && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink dark:text-mist">
                {predictions.length.toLocaleString()} predictions generated
              </p>
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                Download CSV
              </Button>
            </div>
            <div className="max-h-80 overflow-auto rounded-md border border-border dark:border-border-dark">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-paper-dim/60 dark:border-border-dark dark:bg-white/[0.03]">
                    {result.featureColumns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-3 py-2 font-medium text-ink-soft dark:text-mist-soft">
                        {c}
                      </th>
                    ))}
                    <th className="whitespace-nowrap px-3 py-2 font-medium text-teal dark:text-amber">
                      predicted_{result.targetColumn ?? 'target'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0 dark:border-border-dark/60">
                      {result.featureColumns.map((c) => (
                        <td key={c} className="whitespace-nowrap px-3 py-1.5 text-ink-soft dark:text-mist-soft">
                          {String(row[c] ?? '—')}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-3 py-1.5 font-medium text-ink dark:text-mist">
                        {String(predictions[i] ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 200 && (
              <p className="mt-2 text-xs text-ink-soft dark:text-mist-soft">
                Showing the first 200 rows. Download the CSV to see all {rows.length.toLocaleString()}.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
