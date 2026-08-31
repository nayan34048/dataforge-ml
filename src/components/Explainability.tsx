import type { TrainedModelResult } from '../types'
import { useApp } from '../context/AppContext'
import Plot from './Plot'
import { baseLayout, plotConfig } from '../utils/chartTheme'
import { Card, Callout, SectionHeading } from './ui'
import { getModelMeta } from '../ml/modelRegistry'

export function Explainability({ result }: { result: TrainedModelResult }) {
  const { darkMode } = useApp()
  const meta = getModelMeta(result.modelId)
  const importance = result.featureImportance
  const shap = result.shapImportance

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Which information mattered most?"
        description="This chart shows which input columns had the strongest influence on the model's predictions."
      />

      {importance && importance.length > 0 ? (
        <Card className="p-4">
          <Plot
            data={[
              {
                x: [...importance].reverse().map((f) => f.importance),
                y: [...importance].reverse().map((f) => f.feature),
                type: 'bar',
                orientation: 'h',
                marker: { color: '#1F6F5C' },
              },
            ]}
            layout={baseLayout(darkMode, {
              xaxis: { title: { text: 'Relative importance' } },
              height: Math.max(260, importance.length * 32),
              margin: { t: 20, r: 20, b: 40, l: 140 },
            })}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </Card>
      ) : (
        <Callout tone="amber">
          {meta?.shortName ?? 'This model'} doesn't naturally support feature importance, so we're not showing a
          chart here rather than making one up. Try Decision Tree, Random Forest, or Gradient Boosting if you'd like
          to see which columns matter most.
        </Callout>
      )}

      <div>
        <p className="mb-1.5 font-medium text-ink dark:text-mist">Approximate SHAP values</p>
        <p className="mb-3 text-sm leading-relaxed text-ink-soft dark:text-mist-soft">
          SHAP explains predictions by measuring how much each column pushes a prediction away from a baseline
          "no information" guess. Computing the exact value is expensive, so this is a genuine Monte Carlo
          approximation (random-order permutation sampling) computed from the trained model, right here in your
          browser — not a fabricated or pre-canned chart. Treat it as directional rather than exact.
        </p>
        {shap && shap.length > 0 ? (
          <Card className="p-4">
            <Plot
              data={[
                {
                  x: [...shap].reverse().map((f) => f.importance),
                  y: [...shap].reverse().map((f) => f.feature),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#E3A23C' },
                },
              ]}
              layout={baseLayout(darkMode, {
                xaxis: { title: { text: 'Mean |approximate SHAP value| (normalized)' } },
                height: Math.max(260, shap.length * 32),
                margin: { t: 20, r: 20, b: 40, l: 140 },
              })}
              config={plotConfig}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </Card>
        ) : (
          <Callout tone="amber">
            An approximate SHAP explanation isn't available for this particular model/task combination — usually
            because the model doesn't produce a continuous prediction score to attribute (for example, a
            many-category classifier without genuine probability outputs), or because there were too many encoded
            columns to sample this quickly in-browser. This is intentionally left blank rather than shown with
            fabricated numbers.
          </Callout>
        )}
      </div>
    </div>
  )
}
