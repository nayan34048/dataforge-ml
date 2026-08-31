import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { getModelMeta } from '../ml/modelRegistry'
import { trainModel, isRowCountSufficient } from '../ml/trainer'
import { suggestKFolds } from '../utils/random'
import type { TrainedModelResult } from '../types'
import { Button, Card, SectionHeading, Callout } from './ui'

export function TrainingStep() {
  const {
    dataset,
    taskType,
    targetColumn,
    additionalTargetColumns,
    featureColumns,
    modelId,
    modelMode,
    hyperParams,
    setHyperParams,
    settings,
    addResult,
    setStep,
    isTraining,
    setIsTraining,
    trainingError,
    setTrainingError,
  } = useApp()

  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!dataset || !taskType || !modelId) return null
  const meta = getModelMeta(modelId)
  const isCodeOnly = !!meta?.requiresBackend
  const actionLabel = isCodeOnly ? 'Get Python Code' : taskType === 'clustering' ? 'Find Patterns' : 'Build Model'
  const targets = taskType === 'clustering' ? [undefined] : [targetColumn, ...additionalTargetColumns]

  const runTraining = () => {
    setIsTraining(true)
    setTrainingError(null)
    // small delay so the loading state can paint before the (synchronous) computation runs
    setTimeout(() => {
      try {
        for (const target of targets) {
          if (isCodeOnly) {
            const stub: TrainedModelResult = {
              modelId,
              taskType,
              targetColumn: target ?? undefined,
              featureColumns,
              trainedAt: Date.now(),
              hyperParams,
              warnings: [],
              isCodeOnly: true,
            }
            addResult(stub)
            continue
          }
          const result = trainModel({
            dataset,
            taskType,
            modelId,
            targetColumn: target ?? undefined,
            featureColumns,
            hyperParams,
            testSize: settings.testSize,
            seed: settings.randomSeed,
          })
          addResult(result)
        }
        setStep('results')
      } catch (e) {
        setTrainingError(
          e instanceof Error
            ? `We couldn't finish building your model: ${e.message}`
            : 'Something went wrong while building your model. Please try a different model or check your data.'
        )
      } finally {
        setIsTraining(false)
      }
    }, 60)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading eyebrow="Step 5 of 6" title={isCodeOnly ? "This model needs a Python backend" : 'Ready when you are'} />

      {isCodeOnly && (
        <div className="mb-6">
          <Callout tone="amber">
            {meta?.shortName} can't be trained in your browser. We won't run anything here — instead, on the next
            screen you'll get ready-to-run Python (pandas + scikit-learn) code for this exact setup that you can
            paste into your own environment.
          </Callout>
        </div>
      )}

      <Card className="mb-6 p-6">
        <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">Selected model</p>
        <p className="font-display text-xl font-semibold text-ink dark:text-mist">{meta?.shortName}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink-soft dark:text-mist-soft">Task</p>
            <p className="font-medium text-ink dark:text-mist capitalize">{taskType}</p>
          </div>
          <div>
            <p className="text-ink-soft dark:text-mist-soft">Rows available</p>
            <p className="font-medium text-ink dark:text-mist">{dataset.rows.length.toLocaleString()}</p>
          </div>
          {targetColumn && (
            <div>
              <p className="text-ink-soft dark:text-mist-soft">Predicting</p>
              <p className="font-medium text-ink dark:text-mist">
                {targetColumn}
                {additionalTargetColumns.length > 0 && ` + ${additionalTargetColumns.length} more`}
              </p>
            </div>
          )}
          <div>
            <p className="text-ink-soft dark:text-mist-soft">Using columns</p>
            <p className="font-medium text-ink dark:text-mist">{featureColumns.length}</p>
          </div>
        </div>
        {additionalTargetColumns.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft dark:text-mist-soft">
            We'll train a separate {meta?.shortName} model for each of: {[targetColumn, ...additionalTargetColumns].join(', ')}.
          </p>
        )}
      </Card>

      {!isCodeOnly && !isRowCountSufficient(dataset.rows.length) && (
        <div className="mb-6">
          <Callout tone="amber">
            Your dataset only has {dataset.rows.length} rows. That's enough to build a model, but results with very
            little data can be unreliable — treat this as a rough first look.
          </Callout>
        </div>
      )}

      <button
        onClick={() => setShowAdvanced((s) => !s)}
        className="mb-6 text-sm font-medium text-teal dark:text-amber hover:underline"
      >
        {showAdvanced ? 'Hide advanced options' : 'Advanced Options'}
      </button>

      {showAdvanced && (
        <Card className="mb-6 p-5">
          <AdvancedOptions
            modelId={modelId}
            taskType={taskType}
            isCodeOnly={isCodeOnly}
            rowCount={dataset.rows.length}
            hyperParams={hyperParams}
            setHyperParams={setHyperParams}
          />
        </Card>
      )}

      {trainingError && (
        <div className="mb-6">
          <Callout tone="clay">{trainingError}</Callout>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep('model')} disabled={isTraining}>
          Back
        </Button>
        <Button size="lg" onClick={runTraining} disabled={isTraining}>
          {isTraining ? 'Working…' : actionLabel}
        </Button>
      </div>
      {modelMode === 'easy' && !showAdvanced && (
        <p className="mt-4 text-xs text-ink-soft dark:text-mist-soft">
          We're using sensible default settings for you. Advanced users can fine-tune settings above.
        </p>
      )}
    </div>
  )
}

function AdvancedOptions({
  modelId,
  taskType,
  isCodeOnly,
  rowCount,
  hyperParams,
  setHyperParams,
}: {
  modelId: string
  taskType: string
  isCodeOnly: boolean
  rowCount: number
  hyperParams: ReturnType<typeof useApp>['hyperParams']
  setHyperParams: (hp: ReturnType<typeof useApp>['hyperParams']) => void
}) {
  const update = (patch: Partial<typeof hyperParams>) => setHyperParams({ ...hyperParams, ...patch })

  const fields: React.ReactElement[] = []

  if (['decision_tree', 'random_forest', 'gradient_boosting'].includes(modelId)) {
    fields.push(
      <NumberField
        key="maxDepth"
        label="Maximum tree depth"
        help="How many questions deep each tree can go. Deeper trees can learn more detail but may overfit."
        value={hyperParams.maxDepth ?? (modelId === 'random_forest' ? 8 : modelId === 'gradient_boosting' ? 3 : 6)}
        min={1}
        max={20}
        onChange={(v) => update({ maxDepth: v })}
      />
    )
  }
  if (['random_forest', 'gradient_boosting', 'xgboost'].includes(modelId)) {
    fields.push(
      <NumberField
        key="nEstimators"
        label="Number of trees"
        help="More trees can improve accuracy but take longer to train."
        value={hyperParams.nEstimators ?? (modelId === 'random_forest' ? 100 : 80)}
        min={10}
        max={300}
        step={10}
        onChange={(v) => update({ nEstimators: v })}
      />
    )
  }
  if (modelId === 'gradient_boosting' || modelId === 'xgboost') {
    fields.push(
      <NumberField
        key="learningRate"
        label="Learning rate"
        help="How much each new tree corrects previous mistakes. Smaller values are safer but slower to learn."
        value={hyperParams.learningRate ?? 0.1}
        min={0.01}
        max={0.5}
        step={0.01}
        onChange={(v) => update({ learningRate: v })}
      />
    )
  }
  if (modelId === 'knn') {
    fields.push(
      <NumberField
        key="k"
        label="Number of neighbors (k)"
        help="How many similar rows to compare against when making a prediction."
        value={hyperParams.k ?? 5}
        min={1}
        max={25}
        onChange={(v) => update({ k: v })}
      />
    )
  }
  if (modelId === 'ridge_regression') {
    fields.push(
      <NumberField
        key="alpha"
        label="Regularization strength (alpha)"
        help="Higher values shrink the model's coefficients more, trading a little training fit for a model that generalizes better."
        value={hyperParams.alpha ?? 1.0}
        min={0.01}
        max={20}
        step={0.01}
        onChange={(v) => update({ alpha: v })}
      />
    )
  }
  if (taskType === 'clustering' && modelId === 'kmeans') {
    fields.push(
      <NumberField
        key="nClusters"
        label="Number of groups"
        help="How many groups K-Means should try to find in your data."
        value={hyperParams.nClusters ?? 3}
        min={2}
        max={10}
        onChange={(v) => update({ nClusters: v })}
      />
    )
  }
  if (taskType === 'clustering' && modelId === 'dbscan') {
    fields.push(
      <NumberField
        key="minPoints"
        label="Minimum group size"
        help="The fewest nearby points needed to count as a group."
        value={hyperParams.minPoints ?? 5}
        min={2}
        max={20}
        onChange={(v) => update({ minPoints: v })}
      />,
      <NumberField
        key="eps"
        label="Neighborhood distance"
        help="How close points must be to count as neighbors. Leave blank to let us suggest one."
        value={hyperParams.eps ?? 0}
        min={0}
        max={10}
        step={0.1}
        onChange={(v) => update({ eps: v || undefined })}
      />
    )
  }

  if (!isCodeOnly && taskType !== 'clustering') {
    const suggested = suggestKFolds(rowCount)
    const kFoldsOn = !!hyperParams.kFolds
    fields.push(
      <div key="kfolds" className="border-t border-border dark:border-border-dark pt-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-ink dark:text-mist">K-fold cross-validation</label>
          <button
            type="button"
            onClick={() => update({ kFolds: kFoldsOn ? undefined : suggested })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              kFoldsOn
                ? 'bg-teal text-mist dark:bg-amber dark:text-forest'
                : 'border border-border dark:border-border-dark text-ink-soft dark:text-mist-soft'
            }`}
          >
            {kFoldsOn ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mb-2 text-xs text-ink-soft dark:text-mist-soft">
          Instead of a single train/test split, retrains the model {suggested} times on rotating slices of your data
          for a more reliable estimate of performance. Based on your {rowCount.toLocaleString()} rows, we suggest{' '}
          {suggested} folds.
        </p>
        {kFoldsOn && (
          <NumberField
            label="Number of folds"
            help="More folds give a more stable estimate but take longer to compute."
            value={hyperParams.kFolds ?? suggested}
            min={2}
            max={15}
            onChange={(v) => update({ kFolds: v })}
          />
        )}
      </div>
    )
  }

  if (fields.length === 0) {
    return <p className="text-sm text-ink-soft dark:text-mist-soft">This model uses sensible default settings — no advanced options needed.</p>
  }

  return <div className="space-y-4">{fields}</div>
}

function NumberField({
  label,
  help,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  help: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-ink dark:text-mist">{label}</label>
        <span className="font-mono text-sm text-ink-soft dark:text-mist-soft">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal dark:accent-amber"
      />
      <p className="mt-1 text-xs text-ink-soft dark:text-mist-soft">{help}</p>
    </div>
  )
}
