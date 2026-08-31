import { DecisionTree } from './decisionTree'
import { createRng } from '../utils/random'

export interface RandomForestOptions {
  nEstimators: number
  maxDepth: number
  minSamplesLeaf: number
  mode: 'regression' | 'classification'
  nClasses?: number
  seed: number
}

export class RandomForest {
  trees: DecisionTree[] = []
  options: RandomForestOptions
  featureImportance: number[] = []

  constructor(options: RandomForestOptions) {
    this.options = options
  }

  fit(X: number[][], y: number[]) {
    const rng = createRng(this.options.seed)
    const nFeatures = X[0]?.length ?? 0
    const maxFeatures = Math.max(1, Math.round(Math.sqrt(nFeatures)))
    this.featureImportance = new Array(nFeatures).fill(0)

    for (let t = 0; t < this.options.nEstimators; t++) {
      // bootstrap sample
      const bootstrapIdx: number[] = []
      for (let i = 0; i < X.length; i++) {
        bootstrapIdx.push(Math.floor(rng() * X.length))
      }
      const Xb = bootstrapIdx.map((i) => X[i])
      const yb = bootstrapIdx.map((i) => y[i])

      const tree = new DecisionTree({
        maxDepth: this.options.maxDepth,
        minSamplesLeaf: this.options.minSamplesLeaf,
        maxFeatures,
        rng,
        mode: this.options.mode,
        nClasses: this.options.nClasses,
      })
      tree.fit(Xb, yb)
      this.trees.push(tree)
      for (let f = 0; f < nFeatures; f++) this.featureImportance[f] += tree.featureImportance[f] ?? 0
    }

    const total = this.featureImportance.reduce((a, b) => a + b, 0)
    if (total > 0) this.featureImportance = this.featureImportance.map((v) => v / total)
  }

  predict(X: number[][]): number[] {
    if (this.options.mode === 'regression') {
      return X.map((x) => {
        const preds = this.trees.map((t) => t.predictOne(x))
        return preds.reduce((a, b) => a + b, 0) / preds.length
      })
    }
    // classification: majority vote
    return X.map((x) => {
      const votes = new Map<number, number>()
      for (const tree of this.trees) {
        const p = tree.predictOne(x)
        votes.set(p, (votes.get(p) ?? 0) + 1)
      }
      let best = 0
      let bestCount = -1
      for (const [cls, count] of votes) {
        if (count > bestCount) {
          bestCount = count
          best = cls
        }
      }
      return best
    })
  }

  /** Class probability estimate = fraction of trees voting for the positive class (index 1). */
  predictProba(X: number[][]): number[] {
    return X.map((x) => {
      let positiveVotes = 0
      for (const tree of this.trees) {
        if (tree.predictOne(x) === 1) positiveVotes++
      }
      return positiveVotes / this.trees.length
    })
  }
}
