import { useMemo } from 'react'
import type { TrainedModelResult } from '../types'
import { useApp } from '../context/AppContext'
import Plot from './Plot'
import { baseLayout, plotConfig } from '../utils/chartTheme'
import { Card, Callout, Badge } from './ui'
import { CrossValidationCard } from './CrossValidationCard'
import { PredictionsTable } from './PredictionsTable'

export function ResultsRegression({ result }: { result: TrainedModelResult }) {
  const { darkMode, targetColumn } = useApp()
  const metrics = result.regressionMetrics!
  const actuals = (result.actuals as number[]) ?? []
  const predictions = (result.predictions as number[]) ?? []

  const residuals = useMemo(() => actuals.map((a, i) => a - predictions[i]), [actuals, predictions])

  const range = useMemo(() => {
    const all = [...actuals, ...predictions]
    return [Math.min(...all), Math.max(...all)]
  }, [actuals, predictions])

  return (
    <div className="space-y-8">
      <Callout tone="teal">
        <p className="font-medium text-ink dark:text-mist mb-1">Your model is ready 🎉</p>
        <p>
          The model was tested using {result.testRowCount} rows of data it did not see during training (trained on{' '}
          {result.trainRowCount} rows). Remember that a model's quality depends on the dataset, the problem, and the
          amount of available data available to learn from.
        </p>
      </Callout>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Average Error (MAE)"
          value={metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          help={`On average, predictions for "${targetColumn}" are off by about this amount.`}
        />
        <MetricCard
          label="Typical Error (RMSE)"
          value={metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          help="Similar to average error, but penalizes larger mistakes more heavily."
        />
        <MetricCard
          label="R² Score"
          value={metrics.r2.toFixed(3)}
          help="How much of the pattern in your data the model explains. 1.0 is a perfect fit, 0 means no better than guessing the average."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-1 font-medium text-ink dark:text-mist">Actual vs. Predicted</p>
          <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
            Each dot is one test row. Dots closer to the diagonal line mean more accurate predictions.
          </p>
          <Plot
            data={[
              {
                x: actuals,
                y: predictions,
                mode: 'markers',
                type: 'scatter',
                marker: { color: '#1F6F5C', size: 7, opacity: 0.7 },
                name: 'Predictions',
              },
              {
                x: range,
                y: range,
                mode: 'lines',
                type: 'scatter',
                line: { color: '#C1543C', dash: 'dash', width: 1.5 },
                name: 'Perfect prediction',
              },
            ]}
            layout={baseLayout(darkMode, {
              xaxis: { title: { text: 'Actual' } },
              yaxis: { title: { text: 'Predicted' } },
              showlegend: false,
              height: 320,
            })}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </Card>

        <Card className="p-4">
          <p className="mb-1 font-medium text-ink dark:text-mist">Residual Plot</p>
          <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
            Shows the leftover error for each prediction. Points scattered evenly around zero (with no obvious
            pattern) suggest the model isn't systematically biased.
          </p>
          <Plot
            data={[
              {
                x: predictions,
                y: residuals,
                mode: 'markers',
                type: 'scatter',
                marker: { color: '#E3A23C', size: 7, opacity: 0.7 },
              },
            ]}
            layout={baseLayout(darkMode, {
              xaxis: { title: { text: 'Predicted' } },
              yaxis: { title: { text: 'Residual (Actual − Predicted)' }, zeroline: true },
              height: 320,
            })}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </Card>
      </div>

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

function MetricCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card className="p-4">
      <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">{label}</p>
      <p className="mb-2 font-display text-2xl font-semibold text-ink dark:text-mist">{value}</p>
      <p className="text-xs leading-relaxed text-ink-soft dark:text-mist-soft">{help}</p>
    </Card>
  )
}

export function TaskBadge({ text }: { text: string }) {
  return <Badge tone="teal">{text}</Badge>
}
