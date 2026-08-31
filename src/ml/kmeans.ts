import { createRng } from '../utils/random'
import { euclidean } from '../utils/metrics'

export interface KMeansOptions {
  nClusters: number
  maxIterations?: number
  seed: number
}

export class KMeans {
  centroids: number[][] = []
  options: KMeansOptions

  constructor(options: KMeansOptions) {
    this.options = options
  }

  fit(X: number[][]): number[] {
    const rng = createRng(this.options.seed)
    const maxIter = this.options.maxIterations ?? 100
    this.centroids = this.kMeansPlusPlusInit(X, rng)

    let labels = new Array(X.length).fill(0)

    for (let iter = 0; iter < maxIter; iter++) {
      const newLabels = X.map((x) => this.nearestCentroid(x))

      const changed = newLabels.some((l, i) => l !== labels[i])
      labels = newLabels
      if (!changed && iter > 0) break

      // recompute centroids
      const sums: number[][] = Array.from({ length: this.options.nClusters }, () =>
        new Array(X[0]?.length ?? 0).fill(0)
      )
      const counts = new Array(this.options.nClusters).fill(0)
      for (let i = 0; i < X.length; i++) {
        const c = labels[i]
        counts[c]++
        for (let j = 0; j < X[i].length; j++) sums[c][j] += X[i][j]
      }
      for (let c = 0; c < this.options.nClusters; c++) {
        if (counts[c] === 0) continue
        this.centroids[c] = sums[c].map((s) => s / counts[c])
      }
    }

    return labels
  }

  private nearestCentroid(x: number[]): number {
    let best = 0
    let bestDist = Infinity
    for (let c = 0; c < this.centroids.length; c++) {
      const d = euclidean(x, this.centroids[c])
      if (d < bestDist) {
        bestDist = d
        best = c
      }
    }
    return best
  }

  private kMeansPlusPlusInit(X: number[][], rng: () => number): number[][] {
    const centroids: number[][] = []
    const firstIdx = Math.floor(rng() * X.length)
    centroids.push(X[firstIdx])

    while (centroids.length < this.options.nClusters) {
      const distances = X.map((x) => Math.min(...centroids.map((c) => euclidean(x, c) ** 2)))
      const sum = distances.reduce((a, b) => a + b, 0)
      if (sum === 0) {
        // all remaining points identical to a centroid; pick randomly
        centroids.push(X[Math.floor(rng() * X.length)])
        continue
      }
      let target = rng() * sum
      let chosen = 0
      for (let i = 0; i < distances.length; i++) {
        target -= distances[i]
        if (target <= 0) {
          chosen = i
          break
        }
      }
      centroids.push(X[chosen])
    }
    return centroids
  }
}
