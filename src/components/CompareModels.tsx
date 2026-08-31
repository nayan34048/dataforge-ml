import { useApp } from '../context/AppContext'
import { getModelMeta } from '../ml/modelRegistry'
import type { TrainedModelResult } from '../types'
import { Button, Card, SectionHeading, Callout } from './ui'

export function CompareModels() {
  const { results, activeResultIndex, setActiveResultIndex, setStep, modelMode } = useApp()

  if (results.length === 0) return null

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Compare Models"
        description="Different models learn patterns in different ways. Comparing them can help you understand how they perform on your data."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r, i) => (
          <ResultRow key={i} result={r} active={i === activeResultIndex} onSelect={() => setActiveResultIndex(i)} />
        ))}
      </div>

      <Callout tone="amber">
        A higher score isn't automatically "better." Interpretability, the risk of overfitting, training speed, and
        the purpose of your analysis all matter too.
      </Callout>

      <Button
        variant="secondary"
        onClick={() => {
          setStep('model')
        }}
      >
        {modelMode === 'easy' ? 'Try a different model' : 'Try another model'}
      </Button>
    </div>
  )
}

function ResultRow({ result, active, onSelect }: { result: TrainedModelResult; active: boolean; onSelect: () => void }) {
  const meta = getModelMeta(result.modelId)
  const mainScore = getMainScore(result)

  return (
    <Card className={`p-4 ${active ? 'border-teal dark:border-amber' : ''}`}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-medium text-ink dark:text-mist">{meta?.shortName}</p>
          {result.targetColumn && <p className="text-xs text-ink-soft dark:text-mist-soft">Predicting: {result.targetColumn}</p>}
        </div>
        <button onClick={onSelect} className="text-xs font-medium text-teal dark:text-amber hover:underline">
          {active ? 'Viewing' : 'View'}
        </button>
      </div>
      <p className="mb-3 font-display text-xl font-semibold text-ink dark:text-mist">{mainScore.label}: {mainScore.value}</p>
      <details className="text-xs text-ink-soft dark:text-mist-soft">
        <summary className="cursor-pointer select-none">More details</summary>
        <div className="mt-2 space-y-1">
          {result.taskType === 'regression' && result.regressionMetrics && (
            <>
              <p>MAE: {result.regressionMetrics.mae.toFixed(2)}</p>
              <p>RMSE: {result.regressionMetrics.rmse.toFixed(2)}</p>
            </>
          )}
          {result.taskType === 'classification' && result.classificationMetrics && (
            <>
              <p>Precision: {(result.classificationMetrics.precision * 100).toFixed(1)}%</p>
              <p>Recall: {(result.classificationMetrics.recall * 100).toFixed(1)}%</p>
              <p>F1: {(result.classificationMetrics.f1 * 100).toFixed(1)}%</p>
            </>
          )}
          {result.taskType === 'clustering' && result.clusteringMetrics && (
            <>
              <p>Groups found: {result.clusteringMetrics.nClusters}</p>
              {result.clusteringMetrics.noiseCount !== undefined && <p>Outliers: {result.clusteringMetrics.noiseCount}</p>}
            </>
          )}
        </div>
      </details>
    </Card>
  )
}

function getMainScore(result: TrainedModelResult): { label: string; value: string } {
  if (result.isCodeOnly) {
    return { label: 'Status', value: 'Python code generated' }
  }
  if (result.taskType === 'regression' && result.regressionMetrics) {
    return { label: 'R²', value: result.regressionMetrics.r2.toFixed(3) }
  }
  if (result.taskType === 'classification' && result.classificationMetrics) {
    return { label: 'Accuracy', value: `${(result.classificationMetrics.accuracy * 100).toFixed(1)}%` }
  }
  if (result.taskType === 'clustering' && result.clusteringMetrics?.silhouetteScore !== undefined) {
    return { label: 'Silhouette', value: result.clusteringMetrics.silhouetteScore.toFixed(3) }
  }
  return { label: 'Groups', value: String(result.clusteringMetrics?.nClusters ?? '—') }
}
