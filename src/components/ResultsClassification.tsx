import { useMemo } from 'react'
import type { TrainedModelResult } from '../types'
import { useApp } from '../context/AppContext'
import Plot from './Plot'
import { baseLayout, plotConfig } from '../utils/chartTheme'
import { Card, Callout } from './ui'
import { CrossValidationCard } from './CrossValidationCard'
import { PredictionsTable } from './PredictionsTable'

export function ResultsClassification({ result }: { result: TrainedModelResult }) {
  const { darkMode } = useApp()
  const metrics = result.classificationMetrics!

  const cmZ = metrics.confusionMatrix
  const cmText = useMemo(() => cmZ.map((row) => row.map((v) => String(v))), [cmZ])

  return (
    <div className="space-y-8">
      <Callout tone="teal">
        <p className="font-medium text-ink dark:text-mist mb-1">Your model is ready 🎉</p>
        <p>
          The model was tested using {result.testRowCount} rows of data it did not see during training (trained on{' '}
          {result.trainRowCount} rows). Remember that a model's quality depends on the dataset, the problem, and the
          amount of available data.
        </p>
      </Callout>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Accuracy" value={pct(metrics.accuracy)} help="How often the model's prediction was exactly right." />
        <MetricCard label="Precision" value={pct(metrics.precision)} help="Of the predictions for a category, how many were actually correct." />
        <MetricCard label="Recall" value={pct(metrics.recall)} help="Of the actual cases in a category, how many the model found." />
        <MetricCard label="F1 Score" value={pct(metrics.f1)} help="A balance between precision and recall." />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-1 font-medium text-ink dark:text-mist">Confusion Matrix</p>
          <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
            Rows show the actual category; columns show what the model predicted. The diagonal (top-left to
            bottom-right) shows correct predictions.
          </p>
          <Plot
            data={[
              {
                z: cmZ,
                x: metrics.classLabels,
                y: metrics.classLabels,
                type: 'heatmap',
                colorscale: [
                  [0, darkMode ? '#172723' : '#faf9f5'],
                  [1, '#1F6F5C'],
                ],
                text: cmText,
                texttemplate: '%{text}',
                showscale: false,
                hovertemplate: 'Actual: %{y}<br>Predicted: %{x}<br>Count: %{z}<extra></extra>',
              },
            ]}
            layout={baseLayout(darkMode, {
              xaxis: { title: { text: 'Predicted' } },
              yaxis: { title: { text: 'Actual' }, autorange: 'reversed' },
              height: 320,
            })}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </Card>

        {metrics.rocCurve ? (
          <Card className="p-4">
            <p className="mb-1 font-medium text-ink dark:text-mist">ROC Curve {metrics.rocAuc !== undefined && `(AUC = ${metrics.rocAuc.toFixed(3)})`}</p>
            <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
              Shows the trade-off between correctly catching positives and false alarms. A curve that bulges toward
              the top-left is better than the diagonal (random guessing) line.
            </p>
            <Plot
              data={[
                {
                  x: metrics.rocCurve.map((p) => p.fpr),
                  y: metrics.rocCurve.map((p) => p.tpr),
                  mode: 'lines',
                  type: 'scatter',
                  line: { color: '#1F6F5C', width: 2 },
                  name: 'Model',
                },
                {
                  x: [0, 1],
                  y: [0, 1],
                  mode: 'lines',
                  type: 'scatter',
                  line: { color: '#C1543C', dash: 'dash', width: 1.5 },
                  name: 'Random guess',
                },
              ]}
              layout={baseLayout(darkMode, {
                xaxis: { title: { text: 'False Positive Rate' }, range: [0, 1] },
                yaxis: { title: { text: 'True Positive Rate' }, range: [0, 1] },
                showlegend: false,
                height: 320,
              })}
              config={plotConfig}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </Card>
        ) : (
          <Card className="p-4 flex flex-col justify-center">
            <p className="mb-1 font-medium text-ink dark:text-mist">ROC Curve</p>
            <p className="text-sm text-ink-soft dark:text-mist-soft leading-relaxed">
              ROC and precision-recall curves are only shown for two-category problems where the model produces
              genuine probability scores, since they can't be honestly computed from hard predictions alone.
            </p>
          </Card>
        )}
      </div>

      {metrics.prCurve && (
        <Card className="p-4">
          <p className="mb-1 font-medium text-ink dark:text-mist">Precision–Recall Curve</p>
          <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
            Shows how precision changes as the model tries to catch more of the positive cases (recall). Useful when
            one category is much rarer than the other.
          </p>
          <Plot
            data={[
              {
                x: metrics.prCurve.map((p) => p.recall),
                y: metrics.prCurve.map((p) => p.precision),
                mode: 'lines',
                type: 'scatter',
                line: { color: '#E3A23C', width: 2 },
              },
            ]}
            layout={baseLayout(darkMode, {
              xaxis: { title: { text: 'Recall' }, range: [0, 1] },
              yaxis: { title: { text: 'Precision' }, range: [0, 1] },
              height: 300,
            })}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </Card>
      )}

      {result.crossValidation && <CrossValidationCard cv={result.crossValidation} />}

      <PredictionsTable result={result} />

      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, i) => (
            <Callout key={i} tone="amber">
              {w}
            </Callout>
          ))}
        </div>
      )}
    </div>
  )
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function MetricCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card className="p-4">
      <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">{label}</p>
      <p className="mb-2 font-display text-2xl font-semibold text-ink dark:text-mist">{value}</p>
      <p className="text-xs leading-relaxed text-ink-soft dark:text-mist-soft">{help}</p>
    </Card>
  )
}
