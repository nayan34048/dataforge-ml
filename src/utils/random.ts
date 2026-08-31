/** Small deterministic PRNG (mulberry32) so results are reproducible given a seed. */
export function createRng(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleIndices(n: number, rng: () => number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

export interface SplitResult {
  trainIdx: number[]
  testIdx: number[]
}

export function trainTestSplit(n: number, testSize: number, seed: number): SplitResult {
  const rng = createRng(seed)
  const shuffled = shuffleIndices(n, rng)
  const nTest = Math.max(1, Math.round(n * testSize))
  const testIdx = shuffled.slice(0, nTest)
  const trainIdx = shuffled.slice(nTest)
  return { trainIdx, testIdx }
}

/** Splits n rows into k roughly-equal folds and returns, for each fold, the indices used for
 * training (all other folds) and testing (that fold) — the standard k-fold cross-validation scheme. */
export function kFoldSplit(n: number, k: number, seed: number): SplitResult[] {
  const rng = createRng(seed)
  const shuffled = shuffleIndices(n, rng)
  const folds: number[][] = Array.from({ length: k }, () => [])
  shuffled.forEach((idx, i) => folds[i % k].push(idx))
  return folds.map((testIdx, i) => ({
    testIdx,
    trainIdx: folds.filter((_, fi) => fi !== i).flat(),
  }))
}

/** Suggests a reasonable number of cross-validation folds based on how much data is available.
 * Smaller datasets get fewer folds (so each fold still has a meaningful number of rows);
 * larger datasets can afford more folds for a more stable estimate. */
export function suggestKFolds(rowCount: number): number {
  if (rowCount < 40) return 3
  if (rowCount < 150) return 5
  if (rowCount < 600) return 8
  return 10
}
