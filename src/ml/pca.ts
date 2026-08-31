// Lightweight PCA via power iteration + deflation — no external linear algebra
// dependency needed, sufficient for projecting data down to 2 principal components
// for visualization purposes.

export function pca2d(X: number[][]): { x: number; y: number }[] {
  const n = X.length
  const nFeatures = X[0]?.length ?? 0
  if (n === 0 || nFeatures === 0) return []

  // center the data
  const means = new Array(nFeatures).fill(0)
  for (const row of X) for (let j = 0; j < nFeatures; j++) means[j] += row[j]
  for (let j = 0; j < nFeatures; j++) means[j] /= n
  const centered = X.map((row) => row.map((v, j) => v - means[j]))

  if (nFeatures === 1) {
    return centered.map((row) => ({ x: row[0], y: 0 }))
  }

  // covariance matrix (nFeatures x nFeatures)
  const cov: number[][] = Array.from({ length: nFeatures }, () => new Array(nFeatures).fill(0))
  for (const row of centered) {
    for (let a = 0; a < nFeatures; a++) {
      for (let b = 0; b < nFeatures; b++) {
        cov[a][b] += row[a] * row[b]
      }
    }
  }
  for (let a = 0; a < nFeatures; a++) for (let b = 0; b < nFeatures; b++) cov[a][b] /= n - 1 || 1

  const pc1 = powerIteration(cov, nFeatures)
  const deflated = deflate(cov, pc1)
  const pc2 = powerIteration(deflated, nFeatures)

  return centered.map((row) => ({
    x: dot(row, pc1),
    y: dot(row, pc2),
  }))
}

function powerIteration(matrix: number[][], size: number, iterations = 100): number[] {
  let v: number[] = new Array(size).fill(0).map((_, i) => (i === 0 ? 1 : 0.1))
  for (let iter = 0; iter < iterations; iter++) {
    const next = matVec(matrix, v)
    const norm = Math.sqrt(next.reduce((a, b) => a + b * b, 0)) || 1
    v = next.map((x) => x / norm)
  }
  return v
}

function deflate(matrix: number[][], eigenvector: number[]): number[][] {
  const size = matrix.length
  const Av = matVec(matrix, eigenvector)
  const eigenvalue = dot(Av, eigenvector)
  const result: number[][] = Array.from({ length: size }, () => new Array(size).fill(0))
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[i][j] = matrix[i][j] - eigenvalue * eigenvector[i] * eigenvector[j]
    }
  }
  return result
}

function matVec(matrix: number[][], v: number[]): number[] {
  return matrix.map((row) => dot(row, v))
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}
