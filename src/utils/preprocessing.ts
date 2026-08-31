import type { CellValue, Dataset } from '../types'
import { analyzeDataset } from './csv'

/** Remove every row that has at least one missing value. */
export function dropMissingRows(dataset: Dataset): Dataset {
  const rows = dataset.rows.filter((r) => dataset.columns.every((c) => r[c] !== null))
  return { ...dataset, rows, analysis: analyzeDataset(dataset.columns, rows) }
}

/** Fill missing numeric cells with the column median; missing categorical cells with the mode. */
export function fillMissingValues(dataset: Dataset): Dataset {
  const fillValues = new Map<string, CellValue>()
  for (const col of dataset.analysis.columns) {
    if (col.type === 'numeric') {
      fillValues.set(col.name, col.median ?? 0)
    } else {
      fillValues.set(col.name, col.topCategories?.[0]?.value ?? 'unknown')
    }
  }
  const rows = dataset.rows.map((r) => {
    const newRow = { ...r }
    for (const col of dataset.columns) {
      if (newRow[col] === null) {
        newRow[col] = fillValues.get(col) ?? null
      }
    }
    return newRow
  })
  return { ...dataset, rows, analysis: analyzeDataset(dataset.columns, rows) }
}

/** Remove the given columns entirely from the dataset. */
export function dropColumns(dataset: Dataset, columnsToDrop: string[]): Dataset {
  const columns = dataset.columns.filter((c) => !columnsToDrop.includes(c))
  const rows = dataset.rows.map((r) => {
    const newRow: Record<string, CellValue> = {}
    for (const c of columns) newRow[c] = r[c]
    return newRow
  })
  return { ...dataset, columns, rows, analysis: analyzeDataset(columns, rows) }
}

/** Extract a numeric matrix for the given feature columns, encoding categoricals as one-hot. */
export interface EncodedMatrix {
  featureNames: string[]
  X: number[][]
  /** For each engineered feature, which original column it came from (used for feature importance rollups). */
  sourceColumn: string[]
  /** The one-hot category levels used for each categorical column — reuse this when encoding new data
   * (e.g. a freshly uploaded CSV) so the resulting columns line up with what the model was trained on. */
  categoryLevels: Map<string, string[]>
}

export function encodeFeatures(
  rows: Record<string, CellValue>[],
  featureColumns: string[],
  columnTypes: Map<string, 'numeric' | 'categorical'>,
  categoryLevelsOverride?: Map<string, string[]>
): EncodedMatrix {
  const featureNames: string[] = []
  const sourceColumn: string[] = []
  const categoryLevels = new Map<string, string[]>()

  for (const col of featureColumns) {
    if (columnTypes.get(col) === 'numeric') {
      featureNames.push(col)
      sourceColumn.push(col)
    } else {
      const overridden = categoryLevelsOverride?.get(col)
      const levels =
        overridden ?? [...new Set(rows.map((r) => String(r[col] ?? 'unknown')))].sort()
      // limit runaway cardinality; keep top 20 + "other"
      const capped = overridden ?? (levels.length > 20 ? [...levels.slice(0, 20), '__other__'] : levels)
      categoryLevels.set(col, capped)
      for (const lvl of capped) {
        featureNames.push(`${col}=${lvl}`)
        sourceColumn.push(col)
      }
    }
  }

  const X: number[][] = rows.map((row) => {
    const vec: number[] = []
    for (const col of featureColumns) {
      if (columnTypes.get(col) === 'numeric') {
        const v = row[col]
        vec.push(typeof v === 'number' ? v : Number(v) || 0)
      } else {
        const levels = categoryLevels.get(col) ?? []
        const val = String(row[col] ?? 'unknown')
        for (const lvl of levels) {
          if (lvl === '__other__') {
            vec.push(levels.includes(val) ? 0 : 1)
          } else {
            vec.push(val === lvl ? 1 : 0)
          }
        }
      }
    }
    return vec
  })

  return { featureNames, X, sourceColumn, categoryLevels }
}

/** Standardize columns of X to zero mean, unit variance (in place-safe, returns new matrix). */
export function standardize(X: number[][]): { Xs: number[][]; means: number[]; stds: number[] } {
  const nFeatures = X[0]?.length ?? 0
  const means = new Array(nFeatures).fill(0)
  const stds = new Array(nFeatures).fill(1)

  for (let j = 0; j < nFeatures; j++) {
    let sum = 0
    for (const row of X) sum += row[j]
    const mean = sum / (X.length || 1)
    let variance = 0
    for (const row of X) variance += (row[j] - mean) ** 2
    variance /= X.length || 1
    means[j] = mean
    stds[j] = Math.sqrt(variance) || 1
  }

  const Xs = X.map((row) => row.map((v, j) => (v - means[j]) / stds[j]))
  return { Xs, means, stds }
}

/** Apply a previously-computed mean/std standardization to a new matrix (e.g. new data at prediction time). */
export function applyStandardize(X: number[][], means: number[], stds: number[]): number[][] {
  return X.map((row) => row.map((v, j) => (v - (means[j] ?? 0)) / (stds[j] ?? 1)))
}
