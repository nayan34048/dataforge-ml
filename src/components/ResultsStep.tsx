import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ResultsRegression } from './ResultsRegression'
import { ResultsClassification } from './ResultsClassification'
import { ResultsClustering } from './ResultsClustering'
import { CompareModels } from './CompareModels'
import { Explainability } from './Explainability'
import { PythonCodeView } from './PythonCodeView'
import { PredictNewData } from './PredictNewData'
import { Button, SectionHeading, Callout } from './ui'
import { getModelMeta } from '../ml/modelRegistry'

type Tab = 'results' | 'compare' | 'understand' | 'predict' | 'code'

export function ResultsStep() {
  const { results, activeResultIndex, setActiveResultIndex, setStep } = useApp()

  const result = results[activeResultIndex]
  const [tab, setTab] = useState<Tab>(result?.isCodeOnly ? 'code' : 'results')

  if (!result) return null

  const meta = getModelMeta(result.modelId)

  if (result.isCodeOnly) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
        <SectionHeading eyebrow="Step 6 of 6" title={`${meta?.shortName} — Python code`} />

        {results.length > 1 && (
          <ResultSwitcher results={results} activeIndex={activeResultIndex} onSelect={setActiveResultIndex} />
        )}

        <div className="mb-6">
          <Callout tone="amber">
            {meta?.shortName} isn't trained in your browser, so there's nothing to show in Results, Understand
            Results, or Predict on new data for it — just the code below.
          </Callout>
        </div>

        <PythonCodeView result={result} />

        <div className="mt-10 flex flex-wrap gap-3 border-t border-border dark:border-border-dark pt-6">
          <Button variant="secondary" onClick={() => setStep('model')}>
            Try another model
          </Button>
          <Button variant="ghost" onClick={() => setStep('target')}>
            Change what you're predicting
          </Button>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'results', label: 'Results' },
    { id: 'understand', label: 'Understand Results' },
    ...(result.taskType !== 'clustering' ? [{ id: 'predict' as Tab, label: 'Predict New Data' }] : []),
    { id: 'code', label: 'Advanced: Python Code' },
    ...(results.length > 1 ? [{ id: 'compare' as Tab, label: 'Compare Models' }] : []),
  ]

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading
        eyebrow="Step 6 of 6"
        title={result.taskType === 'clustering' ? 'Your patterns are ready' : `Results: ${meta?.shortName}`}
      />

      {results.length > 1 && (
        <ResultSwitcher results={results} activeIndex={activeResultIndex} onSelect={setActiveResultIndex} />
      )}

      <div className="mb-8 flex flex-wrap gap-1 border-b border-border dark:border-border-dark">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-teal text-teal dark:border-amber dark:text-amber'
                : 'border-transparent text-ink-soft dark:text-mist-soft hover:text-ink dark:hover:text-mist'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && result.taskType === 'regression' && <ResultsRegression result={result} />}
      {tab === 'results' && result.taskType === 'classification' && <ResultsClassification result={result} />}
      {tab === 'results' && result.taskType === 'clustering' && <ResultsClustering result={result} />}
      {tab === 'understand' && <Explainability result={result} />}
      {tab === 'predict' && <PredictNewData result={result} />}
      {tab === 'code' && <PythonCodeView result={result} />}
      {tab === 'compare' && <CompareModels />}

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border dark:border-border-dark pt-6">
        <Button variant="secondary" onClick={() => setStep('model')}>
          Try another model
        </Button>
        <Button variant="ghost" onClick={() => setStep('target')}>
          Change what you're predicting
        </Button>
      </div>
    </div>
  )
}

function ResultSwitcher({
  results,
  activeIndex,
  onSelect,
}: {
  results: ReturnType<typeof useApp>['results']
  activeIndex: number
  onSelect: (i: number) => void
}) {
  // Multiple results happen two ways: comparing different models on the same target, or the
  // same model trained against several targets at once — label chips so either case is clear.
  const targets = new Set(results.map((r) => r.targetColumn))
  const isMultiTarget = targets.size > 1

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {results.map((r, i) => {
        const meta = getModelMeta(r.modelId)
        const label = isMultiTarget && r.targetColumn ? r.targetColumn : meta?.shortName ?? r.modelId
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              i === activeIndex
                ? 'border-teal bg-teal text-mist dark:border-amber dark:bg-amber dark:text-forest'
                : 'border-border dark:border-border-dark text-ink-soft dark:text-mist-soft hover:border-teal dark:hover:border-amber'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
