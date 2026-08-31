// Approximate SHAP (SHapley Additive exPlanations) values via Monte Carlo permutation
// sampling. This is a genuine, model-agnostic approximation of Shapley values — the same
// idea behind KernelSHAP's sampling-based estimators — computed entirely in the browser
// from the model's own predictions. It is an approximation (not the exact game-theoretic
// value), which is why results are labeled "approximate" wherever they're shown.
//
// For each row being explained, we sample random feature orderings. For each ordering we
// walk from an all-baseline coalition to the full row, one feature at a time, and credit
// each feature with the change in the model's prediction caused by "revealing" it. Averaged
// over many orderings, this converges to the Shapley value for that feature.

import { createRng, shuffleIndices } from '../utils/random'

export interface ShapOptions {
  /** A continuous scoring function — e.g. a regression prediction or a class probability. */
  predict: (X: number[][]) => number[]
  /** Baseline feature vector (e.g. the mean of the training data) that stands in for "missing" features. */
  background: number[]
  /** The rows to explain. */
  samples: number[][]
  /** Number of random feature permutations per row. More permutations = less noisy estimates, but slower. */
  permutations?: number
  seed?: number
}

/** Returns a [row][feature] matrix of approximate Shapley values, one row per input sample. */
export function approximateShapValues(options: ShapOptions): number[][] {
  const { predict, background, samples } = options
  const M = options.permutations ?? 8
  const nFeatures = background.length
  const rng = createRng(options.seed ?? 7)

  const phi: number[][] = samples.map(() => new Array(nFeatures).fill(0))

  for (let s = 0; s < samples.length; s++) {
    const x = samples[s]
    for (let m = 0; m < M; m++) {
      const order = shuffleIndices(nFeatures, rng)
      const coalition = [...background]
      let prevScore = predict([coalition])[0]
      for (const featureIdx of order) {
        coalition[featureIdx] = x[featureIdx]
        const newScore = predict([coalition])[0]
        phi[s][featureIdx] += newScore - prevScore
        prevScore = newScore
      }
    }
  }

  for (let s = 0; s < phi.length; s++) {
    for (let j = 0; j < nFeatures; j++) phi[s][j] /= M
  }

  return phi
}
