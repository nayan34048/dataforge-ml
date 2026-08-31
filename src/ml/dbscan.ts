import { euclidean } from '../utils/metrics'

export interface DbscanOptions {
  eps: number
  minPoints: number
}

/** Returns cluster labels; -1 indicates a noise point (does not belong to any cluster). */
export function dbscan(X: number[][], options: DbscanOptions): number[] {
  const n = X.length
  const labels = new Array(n).fill(-2) // -2 = unvisited
  let clusterId = -1

  const regionQuery = (i: number): number[] => {
    const neighbors: number[] = []
    for (let j = 0; j < n; j++) {
      if (euclidean(X[i], X[j]) <= options.eps) neighbors.push(j)
    }
    return neighbors
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue
    const neighbors = regionQuery(i)
    if (neighbors.length < options.minPoints) {
      labels[i] = -1 // noise (may later be claimed as a border point)
      continue
    }
    clusterId++
    labels[i] = clusterId
    const seeds = [...neighbors]
    let idx = 0
    while (idx < seeds.length) {
      const q = seeds[idx]
      idx++
      if (labels[q] === -1) labels[q] = clusterId // border point
      if (labels[q] !== -2) continue
      labels[q] = clusterId
      const qNeighbors = regionQuery(q)
      if (qNeighbors.length >= options.minPoints) {
        for (const nb of qNeighbors) if (!seeds.includes(nb)) seeds.push(nb)
      }
    }
  }

  return labels
}

/** Suggests a reasonable eps by looking at the distance to each point's k-th nearest neighbor
 * (a simplified heuristic inspired by the standard k-distance elbow method). */
export function suggestEps(X: number[][], minPoints: number): number {
  const n = X.length
  if (n < 2) return 1
  const kDistances: number[] = []
  const sampleSize = Math.min(n, 200) // cap for performance on large datasets
  for (let i = 0; i < sampleSize; i++) {
    const dists = X.map((x) => euclidean(X[i], x)).sort((a, b) => a - b)
    kDistances.push(dists[Math.min(minPoints, dists.length - 1)])
  }
  kDistances.sort((a, b) => a - b)
  // use 75th percentile as a reasonable default
  return kDistances[Math.floor(kDistances.length * 0.75)] || 1
}
