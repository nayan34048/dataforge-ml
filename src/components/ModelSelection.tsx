import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getModelsForTask, recommendModel } from '../ml/modelRegistry'
import type { ModelMeta } from '../types'
import { Button, Card, Badge, SectionHeading, Callout } from './ui'

export function ModelSelection() {
  const { dataset, taskType, modelMode, setModelMode, modelId, setModelId, setStep } = useApp()
  const [learnMoreId, setLearnMoreId] = useState<string | null>(null)

  const rowCount = dataset?.rows.length ?? 0

  const recommendation = useMemo(() => (taskType ? recommendModel(taskType, rowCount) : null), [taskType, rowCount])
  const allModels = useMemo(() => (taskType ? getModelsForTask(taskType) : []), [taskType])

  if (!dataset || !taskType) return null

  const grouped: Record<string, ModelMeta[]> = {
    classical: allModels.filter((m) => m.category === 'classical'),
    unsupervised: allModels.filter((m) => m.category === 'unsupervised'),
  }

  const categoryLabels: Record<string, string> = {
    classical: 'Classical Machine Learning',
    unsupervised: 'Unsupervised Learning',
  }

  const actionLabel = taskType === 'clustering' ? 'Find Patterns' : 'Build Model'

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading eyebrow="Step 4 of 6" title="How should we build your model?" />

      <div className="mb-8 inline-flex rounded-md border border-border dark:border-border-dark p-1">
        <button
          onClick={() => setModelMode('easy')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            modelMode === 'easy' ? 'bg-teal text-mist dark:bg-amber dark:text-forest' : 'text-ink-soft dark:text-mist-soft'
          }`}
        >
          Recommended for me
        </button>
        <button
          onClick={() => setModelMode('advanced')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            modelMode === 'advanced' ? 'bg-teal text-mist dark:bg-amber dark:text-forest' : 'text-ink-soft dark:text-mist-soft'
          }`}
        >
          Choose a model myself
        </button>
      </div>

      {modelMode === 'easy' && recommendation && (
        <Card className="mb-8 p-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="teal">Recommended</Badge>
            <p className="font-display text-xl font-semibold text-ink dark:text-mist">{recommendation.model.shortName}</p>
          </div>
          <p className="mb-4 text-ink-soft dark:text-mist-soft leading-relaxed">{recommendation.reason}</p>
          <Callout tone="teal">
            <span className="font-medium text-ink dark:text-mist">{recommendation.model.shortName}: </span>
            {recommendation.model.whatItDoes}
          </Callout>
          <button
            onClick={() => setLearnMoreId(learnMoreId === recommendation.model.id ? null : recommendation.model.id)}
            className="mt-4 text-sm font-medium text-teal dark:text-amber hover:underline"
          >
            {learnMoreId === recommendation.model.id ? 'Hide details' : 'Learn more'}
          </button>
          {learnMoreId === recommendation.model.id && <ModelDetails model={recommendation.model} />}
        </Card>
      )}

      {modelMode === 'advanced' && (
        <div className="mb-8 space-y-8">
          {Object.entries(grouped).map(([cat, models]) =>
            models.length ? (
              <div key={cat}>
                <p className="mb-3 text-sm font-medium text-ink-soft dark:text-mist-soft">{categoryLabels[cat]}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {models.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        modelId === m.id
                          ? 'border-teal bg-teal-soft/40 dark:border-amber dark:bg-amber/10'
                          : 'border-border dark:border-border-dark'
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className="font-medium text-ink dark:text-mist">{m.shortName}</p>
                        {m.requiresBackend && <Badge tone="clay">Python code only</Badge>}
                      </div>
                      <p className="mb-3 text-sm text-ink-soft dark:text-mist-soft leading-relaxed">{m.summary}</p>
                      {m.requiresBackend && (
                        <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft leading-relaxed">
                          This model can't run in your browser. Choosing it will skip training here and instead give
                          you ready-to-run Python (pandas + scikit-learn) code for it.
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant={modelId === m.id ? 'primary' : 'secondary'}
                          onClick={() => setModelId(m.id)}
                        >
                          {modelId === m.id ? 'Selected' : m.requiresBackend ? 'Get Python code' : 'Select'}
                        </Button>
                        <button
                          onClick={() => setLearnMoreId(learnMoreId === m.id ? null : m.id)}
                          className="text-sm font-medium text-teal dark:text-amber hover:underline"
                        >
                          {learnMoreId === m.id ? 'Hide' : 'Learn more'}
                        </button>
                      </div>
                      {learnMoreId === m.id && <ModelDetails model={m} />}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep('target')}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={modelMode === 'advanced' && !modelId}
          onClick={() => {
            if (modelMode === 'easy' && recommendation) setModelId(recommendation.model.id)
            setStep('train')
          }}
        >
          {actionLabel} →
        </Button>
      </div>
    </div>
  )
}

function ModelDetails({ model }: { model: ModelMeta }) {
  return (
    <div className="mt-4 grid gap-3 border-t border-border dark:border-border-dark pt-4 text-sm sm:grid-cols-2">
      <div>
        <p className="mb-0.5 font-medium text-ink dark:text-mist">What does it do?</p>
        <p className="text-ink-soft dark:text-mist-soft leading-relaxed">{model.whatItDoes}</p>
      </div>
      <div>
        <p className="mb-0.5 font-medium text-ink dark:text-mist">When might it be useful?</p>
        <p className="text-ink-soft dark:text-mist-soft leading-relaxed">{model.whenUseful}</p>
      </div>
      <div>
        <p className="mb-0.5 font-medium text-ink dark:text-mist">Main strength</p>
        <p className="text-ink-soft dark:text-mist-soft leading-relaxed">{model.strength}</p>
      </div>
      <div>
        <p className="mb-0.5 font-medium text-ink dark:text-mist">Main limitation</p>
        <p className="text-ink-soft dark:text-mist-soft leading-relaxed">{model.limitation}</p>
      </div>
    </div>
  )
}
