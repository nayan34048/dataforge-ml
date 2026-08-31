import { euclidean } from '../utils/metrics'

export interface KnnOptions {
  k: number
  mode: 'regression' | 'classification'
  nClasses?: number
}

export class KnnModel {
  X: number[][] = []
  y: number[] = []
  options: KnnOptions

  constructor(options: KnnOptions) {
    this.options = options
  }

  fit(X: number[][], y: number[]) {
    this.X = X
    this.y = y
  }

  private neighborsOf(x: number[]): number[] {
    const distances = this.X.map((xi, i) => ({ i, d: euclidean(x, xi) }))
    distances.sort((a, b) => a.d - b.d)
    return distances.slice(0, this.options.k).map((d) => d.i)
  }

  predict(X: number[][]): number[] {
    return X.map((x) => {
      const neighbors = this.neighborsOf(x)
      if (this.options.mode === 'regression') {
        const sum = neighbors.reduce((a, i) => a + this.y[i], 0)
        return sum / neighbors.length
      }
      const counts = new Array(this.options.nClasses ?? 2).fill(0)
      for (const i of neighbors) counts[this.y[i]]++
      let best = 0
      let bestCount = -1
      for (let c = 0; c < counts.length; c++) {
        if (counts[c] > bestCount) {
          bestCount = counts[c]
          best = c
        }
      }
      return best
    })
  }

  predictProba(X: number[][]): number[] {
    return X.map((x) => {
      const neighbors = this.neighborsOf(x)
      const positiveCount = neighbors.filter((i) => this.y[i] === 1).length
      return positiveCount / neighbors.length
    })
  }
}
