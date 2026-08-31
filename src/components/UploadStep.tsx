import { useCallback, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { parseCsvToDataset } from '../utils/csv'
import { EXAMPLE_DATASETS } from '../data/exampleDatasets'
import { Button, Card, SectionHeading, Callout } from './ui'

export function UploadStep() {
  const { setDataset, setStep } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please upload a CSV file. Files that end in ".csv" work best.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '')
          const dataset = parseCsvToDataset(file.name.replace(/\.csv$/i, ''), text)
          if (dataset.rows.length === 0 || dataset.columns.length === 0) {
            setError("We couldn't find any data in that file. Please check it has a header row and at least one row of data.")
            return
          }
          setDataset(dataset)
          setStep('goal')
        } catch {
          setError('Something went wrong reading that file. Please check it is a valid CSV file and try again.')
        }
      }
      reader.onerror = () => setError('We could not read that file. Please try again.')
      reader.readAsText(file)
    },
    [setDataset, setStep]
  )

  const loadExample = useCallback(
    (id: string) => {
      const example = EXAMPLE_DATASETS.find((e) => e.id === id)
      if (!example) return
      const dataset = parseCsvToDataset(example.name, example.csv)
      setDataset(dataset)
      setStep('goal')
    },
    [setDataset, setStep]
  )

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading
        eyebrow="Step 1 of 6"
        title="Upload your data"
        description="Bring a spreadsheet of your own, or try one of the example datasets below. No technical knowledge needed — we'll guide you from here."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) loadFile(file)
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          isDragging
            ? 'border-teal bg-teal-soft/40 dark:border-amber dark:bg-amber/10'
            : 'border-border dark:border-border-dark'
        }`}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-teal dark:text-amber">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mb-1 text-ink dark:text-mist font-medium">Drag and drop your CSV file here</p>
        <p className="mb-5 text-sm text-ink-soft dark:text-mist-soft">or</p>
        <Button onClick={() => inputRef.current?.click()}>Choose File</Button>
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
      </div>

      {error && (
        <div className="mt-4">
          <Callout tone="clay">{error}</Callout>
        </div>
      )}

      <div className="mt-12">
        <p className="mb-4 text-sm font-medium text-ink-soft dark:text-mist-soft">
          Not ready to upload your own data? Try an example dataset:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {EXAMPLE_DATASETS.map((ex) => (
            <Card key={ex.id} className="p-4">
              <p className="mb-1 font-display font-semibold text-ink dark:text-mist">{ex.name}</p>
              <p className="mb-4 text-sm text-ink-soft dark:text-mist-soft leading-relaxed">{ex.description}</p>
              <Button variant="secondary" size="sm" onClick={() => loadExample(ex.id)}>
                Try this dataset
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
