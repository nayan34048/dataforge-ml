import type { ClassificationMetrics, RegressionMetrics } from '../types'

export function regressionMetrics(actual: number[], predicted: number[]): RegressionMetrics {
  const n = actual.length
  let sumAbs = 0
  let sumSq = 0
  for (let i = 0; i < n; i++) {
    const err = actual[i] - predicted[i]
    sumAbs += Math.abs(err)
    sumSq += err * err
  }
  const mae = sumAbs / n
  const rmse = Math.sqrt(sumSq / n)
  const mean = actual.reduce((a, b) => a + b, 0) / n
  const ssTot = actual.reduce((a, b) => a + (b - mean) ** 2, 0)
  const ssRes = sumSq
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { mae, rmse, r2 }
}

export function classificationMetrics(
  actualLabels: string[],
  predictedLabels: string[],
  classLabels: string[],
  probabilitiesForPositive?: number[]
): ClassificationMetrics {
  const n = actualLabels.length
  const labelIdx = new Map(classLabels.map((l, i) => [l, i]))
  const cm: number[][] = classLabels.map(() => classLabels.map(() => 0))

  let correct = 0
  for (let i = 0; i < n; i++) {
    const a = labelIdx.get(actualLabels[i])
    const p = labelIdx.get(predictedLabels[i])
    if (a === undefined || p === undefined) continue
    cm[a][p]++
    if (a === p) correct++
  }
  const accuracy = correct / n

  // macro-averaged precision/recall/f1
  let precisionSum = 0
  let recallSum = 0
  let f1Sum = 0
  let validClasses = 0
  for (let c = 0; c < classLabels.length; c++) {
    const tp = cm[c][c]
    const fp = cm.reduce((sum, row, r) => (r === c ? sum : sum + row[c]), 0)
    const fn = cm[c].reduce((sum, v, colIdx) => (colIdx === c ? sum : sum + v), 0)
    const support = cm[c].reduce((s, v) => s + v, 0)
    if (support === 0) continue
    validClasses++
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    precisionSum += precision
    recallSum += recall
    f1Sum += f1
  }
  const precision = validClasses ? precisionSum / validClasses : 0
  const recall = validClasses ? recallSum / validClasses : 0
  const f1 = validClasses ? f1Sum / validClasses : 0

  const result: ClassificationMetrics = {
    accuracy,
    precision,
    recall,
    f1,
    confusionMatrix: cm,
    classLabels,
  }

  // ROC-AUC / curves only for binary classification with genuine probability scores
  if (classLabels.length === 2 && probabilitiesForPositive) {
    const positiveLabel = classLabels[1]
    const yTrue = actualLabels.map((l) => (l === positiveLabel ? 1 : 0))
    const { auc, roc, pr } = computeRocPr(yTrue, probabilitiesForPositive)
    result.rocAuc = auc
    result.rocCurve = roc
    result.prCurve = pr
  }

  return result
}

/** Computes ROC curve, PR curve, and AUC from genuine predicted probabilities (never from hard labels). */
function computeRocPr(
  yTrue: number[],
  scores: number[]
): { auc: number; roc: { fpr: number; tpr: number }[]; pr: { recall: number; precision: number }[] } {
  const n = yTrue.length
  const paired = scores.map((s, i) => ({ s, y: yTrue[i] })).sort((a, b) => b.s - a.s)
  const totalPos = yTrue.reduce((a, b) => a + b, 0)
  const totalNeg = n - totalPos

  const roc: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }]
  const pr: { recall: number; precision: number }[] = []
  let tp = 0
  let fp = 0

  for (let i = 0; i < paired.length; i++) {
    if (paired[i].y === 1) tp++
    else fp++
    const tpr = totalPos === 0 ? 0 : tp / totalPos
    const fpr = totalNeg === 0 ? 0 : fp / totalNeg
    roc.push({ fpr, tpr })
    const precision = tp + fp === 0 ? 1 : tp / (tp + fp)
    pr.push({ recall: tpr, precision })
  }

  // trapezoidal AUC over ROC points (sorted by fpr since scores were sorted descending, fpr is non-decreasing)
  let auc = 0
  for (let i = 1; i < roc.length; i++) {
    const dx = roc[i].fpr - roc[i - 1].fpr
    const avgY = (roc[i].tpr + roc[i - 1].tpr) / 2
    auc += dx * avgY
  }

  return { auc, roc, pr }
}

export function silhouetteScore(X: number[][], labels: number[]): number {
  const n = X.length
  if (n < 2) return 0
  const clusters = new Map<number, number[]>()
  labels.forEach((l, i) => {
    if (l < 0) return // ignore noise points (DBSCAN)
    if (!clusters.has(l)) clusters.set(l, [])
    clusters.get(l)!.push(i)
  })
  if (clusters.size < 2) return 0

  let total = 0
  let count = 0
  for (const [label, members] of clusters) {
    if (members.length < 2) continue
    for (const i of members) {
      const a = avgDistance(X, i, members.filter((m) => m !== i))
      let b = Infinity
      for (const [otherLabel, otherMembers] of clusters) {
        if (otherLabel === label || otherMembers.length === 0) continue
        const d = avgDistance(X, i, otherMembers)
        if (d < b) b = d
      }
      if (!Number.isFinite(b)) continue
      const s = (b - a) / Math.max(a, b, 1e-9)
      total += s
      count++
    }
  }
  return count ? total / count : 0
}

function avgDistance(X: number[][], i: number, others: number[]): number {
  if (others.length === 0) return 0
  let sum = 0
  for (const j of others) sum += euclidean(X[i], X[j])
  return sum / others.length
}

export function euclidean(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}
