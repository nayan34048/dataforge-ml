// A genuine CART-style decision tree, used standalone and as the base learner
// for Random Forest and Gradient Boosting.

export interface TreeNode {
  isLeaf: boolean
  prediction?: number
  featureIndex?: number
  threshold?: number
  left?: TreeNode
  right?: TreeNode
  samples: number
}

export interface TreeOptions {
  maxDepth: number
  minSamplesLeaf: number
  /** Number of random features to consider per split (for Random Forest). Defaults to all. */
  maxFeatures?: number
  rng?: () => number
  mode: 'regression' | 'classification'
  /** Number of distinct classes, required for classification mode (labels are 0..nClasses-1). */
  nClasses?: number
}

export class DecisionTree {
  root: TreeNode | null = null
  options: TreeOptions
  featureImportance: number[] = []

  constructor(options: TreeOptions) {
    this.options = options
  }

  fit(X: number[][], y: number[]) {
    const nFeatures = X[0]?.length ?? 0
    this.featureImportance = new Array(nFeatures).fill(0)
    const indices = Array.from({ length: X.length }, (_, i) => i)
    this.root = this.buildNode(X, y, indices, 0)
    const totalImportance = this.featureImportance.reduce((a, b) => a + b, 0)
    if (totalImportance > 0) {
      this.featureImportance = this.featureImportance.map((v) => v / totalImportance)
    }
  }

  private buildNode(X: number[][], y: number[], indices: number[], depth: number): TreeNode {
    const { maxDepth, minSamplesLeaf, mode } = this.options

    if (
      depth >= maxDepth ||
      indices.length < minSamplesLeaf * 2 ||
      isPure(y, indices)
    ) {
      return { isLeaf: true, prediction: leafPrediction(y, indices, mode, this.options.nClasses), samples: indices.length }
    }

    const split = this.findBestSplit(X, y, indices)
    if (!split) {
      return { isLeaf: true, prediction: leafPrediction(y, indices, mode, this.options.nClasses), samples: indices.length }
    }

    this.featureImportance[split.featureIndex] += split.gain * indices.length

    const leftIdx = indices.filter((i) => X[i][split.featureIndex] <= split.threshold)
    const rightIdx = indices.filter((i) => X[i][split.featureIndex] > split.threshold)

    if (leftIdx.length < minSamplesLeaf || rightIdx.length < minSamplesLeaf) {
      return { isLeaf: true, prediction: leafPrediction(y, indices, mode, this.options.nClasses), samples: indices.length }
    }

    return {
      isLeaf: false,
      featureIndex: split.featureIndex,
      threshold: split.threshold,
      left: this.buildNode(X, y, leftIdx, depth + 1),
      right: this.buildNode(X, y, rightIdx, depth + 1),
      samples: indices.length,
    }
  }

  private findBestSplit(
    X: number[][],
    y: number[],
    indices: number[]
  ): { featureIndex: number; threshold: number; gain: number } | null {
    const nFeatures = X[0]?.length ?? 0
    let candidateFeatures = Array.from({ length: nFeatures }, (_, i) => i)

    if (this.options.maxFeatures && this.options.maxFeatures < nFeatures) {
      const rng = this.options.rng ?? Math.random
      candidateFeatures = sampleWithoutReplacement(candidateFeatures, this.options.maxFeatures, rng)
    }

    const parentImpurity = impurity(y, indices, this.options.mode, this.options.nClasses)
    let best: { featureIndex: number; threshold: number; gain: number } | null = null

    for (const f of candidateFeatures) {
      const sorted = [...indices].sort((a, b) => X[a][f] - X[b][f])
      const values = sorted.map((i) => X[i][f])

      // try a subset of candidate thresholds (midpoints between distinct consecutive values)
      const thresholds: number[] = []
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1]) thresholds.push((values[i] + values[i - 1]) / 2)
      }
      // cap thresholds tried for performance on large columns
      const step = Math.max(1, Math.floor(thresholds.length / 40))
      for (let t = 0; t < thresholds.length; t += step) {
        const threshold = thresholds[t]
        const leftIdx = indices.filter((i) => X[i][f] <= threshold)
        const rightIdx = indices.filter((i) => X[i][f] > threshold)
        if (leftIdx.length === 0 || rightIdx.length === 0) continue

        const leftImp = impurity(y, leftIdx, this.options.mode, this.options.nClasses)
        const rightImp = impurity(y, rightIdx, this.options.mode, this.options.nClasses)
        const weightedImp =
          (leftIdx.length / indices.length) * leftImp + (rightIdx.length / indices.length) * rightImp
        const gain = parentImpurity - weightedImp

        if (!best || gain > best.gain) {
          best = { featureIndex: f, threshold, gain }
        }
      }
    }

    if (!best || best.gain <= 1e-12) return null
    return best
  }

  predictOne(x: number[]): number {
    let node = this.root
    while (node && !node.isLeaf) {
      if (x[node.featureIndex!] <= node.threshold!) node = node.left!
      else node = node.right!
    }
    return node?.prediction ?? 0
  }

  predict(X: number[][]): number[] {
    return X.map((x) => this.predictOne(x))
  }
}

function isPure(y: number[], indices: number[]): boolean {
  const first = y[indices[0]]
  return indices.every((i) => y[i] === first)
}

function leafPrediction(
  y: number[],
  indices: number[],
  mode: 'regression' | 'classification',
  nClasses?: number
): number {
  if (mode === 'regression') {
    const sum = indices.reduce((a, i) => a + y[i], 0)
    return sum / indices.length
  }
  // classification: majority class
  const counts = new Array(nClasses ?? 2).fill(0)
  for (const i of indices) counts[y[i]]++
  let maxCount = -1
  let best = 0
  for (let c = 0; c < counts.length; c++) {
    if (counts[c] > maxCount) {
      maxCount = counts[c]
      best = c
    }
  }
  return best
}

function impurity(y: number[], indices: number[], mode: 'regression' | 'classification', nClasses?: number): number {
  if (mode === 'regression') {
    const mean = indices.reduce((a, i) => a + y[i], 0) / indices.length
    return indices.reduce((a, i) => a + (y[i] - mean) ** 2, 0) / indices.length
  }
  // gini impurity
  const counts = new Array(nClasses ?? 2).fill(0)
  for (const i of indices) counts[y[i]]++
  let gini = 1
  for (const c of counts) {
    const p = c / indices.length
    gini -= p * p
  }
  return gini
}

function sampleWithoutReplacement<T>(arr: T[], k: number, rng: () => number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, k)
}
