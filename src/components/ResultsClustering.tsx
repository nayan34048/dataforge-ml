import { useMemo } from 'react'
import type { TrainedModelResult } from '../types'
import { useApp } from '../context/AppContext'
import Plot from './Plot'
import { baseLayout, plotConfig, PALETTE } from '../utils/chartTheme'
import { Card, Callout } from './ui'

export function ResultsClustering({ result }: { result: TrainedModelResult }) {
  const { darkMode } = useApp()
  const metrics = result.clusteringMetrics!
  const points = result.pca2d ?? []

  const traces = useMemo(() => {
    const clusters = [...new Set(points.map((p) => p.cluster))].sort((a, b) => a - b)
    return clusters.map((c) => {
      const subset = points.filter((p) => p.cluster === c)
      return {
        x: subset.map((p) => p.x),
        y: subset.map((p) => p.y),
        mode: 'markers' as const,
        type: 'scatter' as const,
        name: c === -1 ? 'Noise / outliers' : `Group ${c + 1}`,
        marker: {
          color: c === -1 ? '#A9BFB9' : PALETTE[c % PALETTE.length],
          size: 7,
          opacity: c === -1 ? 0.4 : 0.75,
        },
      }
    })
  }, [points])

  return (
    <div className="space-y-8">
      <Callout tone="teal">
        <p className="font-medium text-ink dark:text-mist mb-1">We found {metrics.nClusters} group{metrics.nClusters === 1 ? '' : 's'} in your data 🎉</p>
        <p>
          Groups are based on similarity across the columns you selected.
          {metrics.noiseCount !== undefined && metrics.noiseCount > 0
            ? ` ${metrics.noiseCount} observation${metrics.noiseCount === 1 ? '' : 's'} didn't fit clearly into any group and are marked as outliers.`
            : ''}
        </p>
      </Callout>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">Groups found</p>
          <p className="font-display text-2xl font-semibold text-ink dark:text-mist">{metrics.nClusters}</p>
        </Card>
        {metrics.silhouetteScore !== undefined && (
          <Card className="p-4">
            <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">Silhouette Score</p>
            <p className="mb-1 font-display text-2xl font-semibold text-ink dark:text-mist">{metrics.silhouetteScore.toFixed(3)}</p>
            <p className="text-xs leading-relaxed text-ink-soft dark:text-mist-soft">
              Ranges from -1 to 1. Higher means groups are well separated. This is one signal among several — it
              doesn't alone prove the groups are meaningful.
            </p>
          </Card>
        )}
        {metrics.noiseCount !== undefined && (
          <Card className="p-4">
            <p className="mb-1 text-sm text-ink-soft dark:text-mist-soft">Outliers</p>
            <p className="font-display text-2xl font-semibold text-ink dark:text-mist">{metrics.noiseCount}</p>
          </Card>
        )}
      </div>

      <Card className="p-4">
        <p className="mb-1 font-medium text-ink dark:text-mist">Cluster Visualization (2D projection)</p>
        <p className="mb-3 text-xs text-ink-soft dark:text-mist-soft">
          Since your data likely has more than two columns, we've compressed it down to two dimensions (using PCA)
          so the groups can be visualized. Points closer together are more similar.
        </p>
        <Plot
          data={traces}
          layout={baseLayout(darkMode, {
            xaxis: { title: { text: 'Component 1' } },
            yaxis: { title: { text: 'Component 2' } },
            height: 420,
          })}
          config={plotConfig}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-medium text-ink dark:text-mist">Group Sizes</p>
        <Plot
          data={[
            {
              x: metrics.clusterSizes.map((c) => `Group ${c.cluster + 1}`),
              y: metrics.clusterSizes.map((c) => c.count),
              type: 'bar',
              marker: { color: metrics.clusterSizes.map((c) => PALETTE[c.cluster % PALETTE.length]) },
            },
          ]}
          layout={baseLayout(darkMode, { yaxis: { title: { text: 'Rows' } }, height: 260 })}
          config={plotConfig}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </Card>

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
