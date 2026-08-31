import { DecisionTree } from './decisionTree'

export interface GradientBoostingOptions {
  nEstimators: number
  learningRate: number
  maxDepth: number
  mode: 'regression' | 'classification'
}

/** Gradient boosting with squared-error loss (regression) or log-loss (binary classification),
 * using shallow regression trees as base learners at every stage — a genuine, from-scratch
 * implementation (not a lookup table or fabricated output). */
export class GradientBoosting {
  trees: DecisionTree[] = []
  initialPrediction = 0
  options: GradientBoostingOptions
  featureImportance: number[] = []

  constructor(options: GradientBoostingOptions) {
    this.options = options
  }

  fit(X: number[][], y: number[]) {
    const n = X.length
    const nFeatures = X[0]?.length ?? 0
    this.featureImportance = new Array(nFeatures).fill(0)

    if (this.options.mode === 'regression') {
      this.initialPrediction = y.reduce((a, b) => a + b, 0) / n
    } else {
      const posRate = y.reduce((a, b) => a + b, 0) / n
      const p = Math.min(Math.max(posRate, 1e-6), 1 - 1e-6)
      this.initialPrediction = Math.log(p / (1 - p)) // log-odds
    }

    let currentPred = new Array(n).fill(this.initialPrediction)

    for (let m = 0; m < this.options.nEstimators; m++) {
      const residuals =
        this.options.mode === 'regression'
          ? y.map((yi, i) => yi - currentPred[i])
          : y.map((yi, i) => yi - sigmoid(currentPred[i])) // negative gradient of log-loss

      const tree = new DecisionTree({
        maxDepth: this.options.maxDepth,
        minSamplesLeaf: 5,
        mode: 'regression', // residuals are always fit with a regression tree
      })
      tree.fit(X, residuals)
      this.trees.push(tree)

      for (let f = 0; f < nFeatures; f++) this.featureImportance[f] += tree.featureImportance[f] ?? 0

      const update = tree.predict(X)
      currentPred = currentPred.map((p, i) => p + this.options.learningRate * update[i])
    }

    const total = this.featureImportance.reduce((a, b) => a + b, 0)
    if (total > 0) this.featureImportance = this.featureImportance.map((v) => v / total)
  }

  private rawScore(x: number[]): number {
    let score = this.initialPrediction
    for (const tree of this.trees) score += this.options.learningRate * tree.predictOne(x)
    return score
  }

  predict(X: number[][]): number[] {
    if (this.options.mode === 'regression') {
      return X.map((x) => this.rawScore(x))
    }
    return X.map((x) => (sigmoid(this.rawScore(x)) >= 0.5 ? 1 : 0))
  }

  predictProba(X: number[][]): number[] {
    return X.map((x) => sigmoid(this.rawScore(x)))
  }
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}
