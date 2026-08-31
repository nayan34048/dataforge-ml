import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { TaskType } from '../types'
import { Button, Callout, SectionHeading, Badge } from './ui'

export function TargetSelection() {
  const { dataset, goal, setTaskType, setTargetColumn, setAdditionalTargetColumns, setFeatureColumns, setStep } = useApp()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [additionalTargets, setAdditionalTargets] = useState<Set<string>>(new Set())

  const columnByName = useMemo(() => new Map(dataset?.analysis.columns.map((c) => [c.name, c]) ?? []), [dataset])

  const suggestedTaskFor = (colName: string): TaskType | null => {
    const col = columnByName.get(colName)
    if (!col) return null
    return col.type === 'numeric' && col.uniqueCount > 10 ? 'regression' : 'classification'
  }

  if (!dataset) return null

  if (goal === 'predict') {
    const suggestedTask: TaskType | null = selectedTarget ? suggestedTaskFor(selectedTarget) : null

    // Columns that could be trained as an additional target alongside the primary one — they must
    // suggest the same task type, since a single model/task pairing is used across all targets.
    const additionalTargetOptions = selectedTarget
      ? dataset.columns.filter((c) => c !== selectedTarget && suggestedTaskFor(c) === suggestedTask)
      : []

    const excludedFromFeatures = new Set([selectedTarget, ...additionalTargets].filter(Boolean) as string[])
    const featureOptions = dataset.columns.filter((c) => !excludedFromFeatures.has(c))
    const effectiveFeatures =
      selectedFeatures.size > 0 ? [...selectedFeatures].filter((c) => !excludedFromFeatures.has(c)) : featureOptions

    const canContinue = !!selectedTarget && effectiveFeatures.length > 0

    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
        <SectionHeading
          eyebrow="Step 3 of 6"
          title="What would you like to predict?"
          description="Choose the column containing the result you want the model to learn and predict."
        />

        <div className="mb-8 grid gap-2 sm:grid-cols-2">
          {dataset.columns.map((col) => {
            const summary = columnByName.get(col)!
            const active = selectedTarget === col
            return (
              <button
                key={col}
                onClick={() => {
                  setSelectedTarget(col)
                  setAdditionalTargets((prev) => {
                    const next = new Set(prev)
                    next.delete(col)
                    return next
                  })
                }}
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? 'border-teal bg-teal-soft/40 dark:border-amber dark:bg-amber/10'
                    : 'border-border dark:border-border-dark hover:border-teal/60 dark:hover:border-amber/60'
                }`}
              >
                <span className="font-medium text-ink dark:text-mist">{col}</span>
                <Badge tone={summary.type === 'numeric' ? 'teal' : 'amber'}>{summary.type}</Badge>
              </button>
            )
          })}
        </div>

        {selectedTarget && suggestedTask && (
          <div className="mb-8">
            <Callout tone="teal">
              <p className="font-medium text-ink dark:text-mist mb-1">
                {suggestedTask === 'regression' ? 'This looks like a Regression problem' : 'This looks like a Classification problem'}
              </p>
              <p>
                {suggestedTask === 'regression'
                  ? `"${selectedTarget}" holds many different numbers, so we'll predict a number — like price, temperature, or a measurement.`
                  : `"${selectedTarget}" holds a limited set of categories, so we'll predict a category — like Yes/No or Pass/Fail.`}
              </p>
            </Callout>
          </div>
        )}

        {selectedTarget && additionalTargetOptions.length > 0 && (
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-ink dark:text-mist">
              Predict more than one target at once?{' '}
              <span className="font-normal text-ink-soft dark:text-mist-soft">
                (optional — we'll train a separate model for each target you pick, so you can compare them side by side)
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {additionalTargetOptions.map((col) => {
                const on = additionalTargets.has(col)
                return (
                  <button
                    key={col}
                    onClick={() => {
                      const next = new Set(additionalTargets)
                      if (next.has(col)) next.delete(col)
                      else next.add(col)
                      setAdditionalTargets(next)
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      on
                        ? 'border-teal bg-teal text-mist dark:border-amber dark:bg-amber dark:text-forest'
                        : 'border-border dark:border-border-dark text-ink-soft dark:text-mist-soft hover:border-teal dark:hover:border-amber'
                    }`}
                  >
                    {col}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedTarget && (
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-ink dark:text-mist">
              Which columns should the model use? <span className="font-normal text-ink-soft dark:text-mist-soft">(optional — leave unselected to use all other columns)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {featureOptions.map((col) => {
                const on = selectedFeatures.size === 0 || selectedFeatures.has(col)
                return (
                  <button
                    key={col}
                    onClick={() => {
                      const base = selectedFeatures.size === 0 ? new Set(featureOptions) : new Set(selectedFeatures)
                      if (base.has(col)) base.delete(col)
                      else base.add(col)
                      setSelectedFeatures(base)
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      on
                        ? 'border-teal bg-teal text-mist dark:border-amber dark:bg-amber dark:text-forest'
                        : 'border-border dark:border-border-dark text-ink-soft dark:text-mist-soft hover:border-teal dark:hover:border-amber'
                    }`}
                  >
                    {col}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep('goal')}>
            Back
          </Button>
          <Button
            size="lg"
            disabled={!canContinue}
            onClick={() => {
              if (!selectedTarget || !suggestedTask) return
              setTaskType(suggestedTask)
              setTargetColumn(selectedTarget)
              setAdditionalTargetColumns([...additionalTargets])
              setFeatureColumns(effectiveFeatures)
              setStep('model')
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    )
  }

  // explore patterns
  const numericCols = dataset.analysis.numericColumns
  const effectiveFeatures = selectedFeatures.size > 0 ? [...selectedFeatures] : numericCols

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading
        eyebrow="Step 3 of 6"
        title="Which columns should we look at?"
        description="This option looks for observations that are naturally similar without requiring you to provide a result or answer column."
      />

      {numericCols.length < 2 ? (
        <Callout tone="clay">
          Pattern exploration needs at least two numerical columns to compare. Your dataset currently has {numericCols.length}. Try a different dataset or add more numeric columns.
        </Callout>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {numericCols.map((col) => {
              const on = selectedFeatures.size === 0 || selectedFeatures.has(col)
              return (
                <button
                  key={col}
                  onClick={() => {
                    const base = selectedFeatures.size === 0 ? new Set(numericCols) : new Set(selectedFeatures)
                    if (base.has(col)) base.delete(col)
                    else base.add(col)
                    setSelectedFeatures(base)
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? 'border-teal bg-teal text-mist dark:border-amber dark:bg-amber dark:text-forest'
                      : 'border-border dark:border-border-dark text-ink-soft dark:text-mist-soft hover:border-teal dark:hover:border-amber'
                  }`}
                >
                  {col}
                </button>
              )
            })}
          </div>
          <p className="mb-8 text-sm text-ink-soft dark:text-mist-soft">
            Balance the measurements: some columns use larger numbers than others. We'll automatically scale them so no single measurement unfairly dominates the analysis.
          </p>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep('goal')}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={numericCols.length < 2 || effectiveFeatures.length < 2}
          onClick={() => {
            setTaskType('clustering')
            setAdditionalTargetColumns([])
            setFeatureColumns(effectiveFeatures)
            setStep('model')
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
