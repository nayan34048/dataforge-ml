import type { CrossValidationResult } from '../types'
import { useApp } from '../context/AppContext'
import Plot from './Plot'
import { baseLayout, plotConfig } from '../utils/chartTheme'
import { Card } from './ui'

/** Shows the score from each cross-validation fold plus the mean ± standard deviation —
 * a more reliable read on performance than any single train/test split. */
export function CrossValidationCard({ cv }: { cv: CrossValidationResult }) {
  const { darkMode } = useApp()

  return (
    <Card className="p-4">
      <p className="mb-1 font-medium text-ink dark:text-mist">
        {cv.folds}-Fold Cross-Validation ({cv.metricName})
      </p>
      <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
        The model was retrained {cv.folds} times, each time testing on a different slice of your data. Consistent
        bars across folds suggest a more dependable result than a single train/test split.
      </p>
      <Plot
        data={[
          {
            x: cv.foldScores.map((_, i) => `Fold ${i + 1}`),
            y: cv.foldScores,
            type: 'bar',
            marker: { color: '#1F6F5C' },
          },
        ]}
        layout={baseLayout(darkMode, {
          yaxis: { title: { text: cv.metricName } },
          height: 260,
        })}
        config={plotConfig}
        style={{ width: '100%' }}
        useResizeHandler
      />
      <p className="mt-3 text-sm text-ink dark:text-mist">
        Mean: <span className="font-semibold">{cv.meanScore.toFixed(3)}</span> · Std. dev:{' '}
        <span className="font-semibold">{cv.stdScore.toFixed(3)}</span>
      </p>
    </Card>
  )
}
