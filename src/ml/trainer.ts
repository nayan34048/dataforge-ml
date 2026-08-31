import type {
  CellValue,
  CrossValidationResult,
  Dataset,
  FeatureImportance,
  HyperParams,
  ModelId,
  PredictNewDataResult,
  TaskType,
  TrainedModelResult,
} from '../types'
import { applyStandardize, encodeFeatures, standardize } from '../utils/preprocessing'
import { kFoldSplit, trainTestSplit } from '../utils/random'
import { classificationMetrics, regressionMetrics, silhouetteScore } from '../utils/metrics'
import { LinearRegression, LogisticRegression, RidgeRegression } from './linearModels'
import { GaussianNaiveBayes } from './naiveBayes'
import { DecisionTree } from './decisionTree'
import { RandomForest } from './randomForest'
import { KnnModel } from './knn'
import { GradientBoosting } from './gradientBoosting'
import { KMeans } from './kmeans'
import { dbscan, suggestEps } from './dbscan'
import { pca2d } from './pca'
import { approximateShapValues } from './shap'

export interface TrainRequest {
  dataset: Dataset
  taskType: TaskType
  modelId: ModelId
  targetColumn?: string
  featureColumns: string[]
  hyperParams: HyperParams
  testSize: number
  seed: number
}

const MIN_ROWS_FOR_RELIABLE_TRAINING = 20

/** Models sensitive to feature scale — trained on standardized (zero-mean, unit-variance) features. */
const SCALED_MODELS = new Set<ModelId>(['knn', 'linear_regression', 'ridge_regression', 'logistic_regression'])

export function trainModel(request: TrainRequest): TrainedModelResult {
  const { dataset, taskType, modelId, targetColumn, featureColumns, hyperParams, testSize, seed } = request
  const warnings: string[] = []

  if (dataset.rows.length < MIN_ROWS_FOR_RELIABLE_TRAINING) {
    warnings.push(
      `Your dataset only has ${dataset.rows.length} rows. Results with fewer than ${MIN_ROWS_FOR_RELIABLE_TRAINING} rows can be unreliable — consider this a rough first look rather than a dependable model.`
    )
  }

  const columnTypeMap = new Map(dataset.analysis.columns.map((c) => [c.name, c.type]))

  if (taskType === 'clustering') {
    return trainClustering({ dataset, modelId, featureColumns, hyperParams, seed, columnTypeMap, warnings })
  }

  return trainSupervised({
    dataset,
    taskType,
    modelId,
    targetColumn: targetColumn!,
    featureColumns,
    hyperParams,
    testSize,
    seed,
    columnTypeMap,
    warnings,
  })
}

/** A trained model's predict function, plus (when meaningful) a continuous score function used
 * for probability-style outputs and for Shapley-value explanations. */
interface FitResult {
  predict: (X: number[][]) => number[]
  score?: (X: number[][]) => number[]
  featureImportanceRaw?: number[]
}

function fitModel(
  modelId: ModelId,
  taskType: TaskType,
  Xtrain: number[][],
  ytrain: number[],
  hyperParams: HyperParams,
  seed: number,
  nClasses: number
): FitResult {
  const isReg = taskType === 'regression'

  switch (modelId) {
    case 'linear_regression': {
      const model = new LinearRegression()
      model.fit(Xtrain, ytrain, { epochs: 600, learningRate: 0.05 })
      return { predict: (X) => model.predict(X), score: (X) => model.predict(X) }
    }
    case 'ridge_regression': {
      const model = new RidgeRegression()
      model.fit(Xtrain, ytrain, { epochs: 600, learningRate: 0.05, alpha: hyperParams.alpha ?? 1.0 })
      return { predict: (X) => model.predict(X), score: (X) => model.predict(X) }
    }
    case 'logistic_regression': {
      const model = new LogisticRegression()
      model.fit(Xtrain, ytrain, { epochs: 800, learningRate: 0.1 })
      return {
        predict: (X) => model.predictProba(X).map((p) => (p >= 0.5 ? 1 : 0)),
        score: (X) => model.predictProba(X),
      }
    }
    case 'naive_bayes': {
      const model = new GaussianNaiveBayes({ nClasses })
      model.fit(Xtrain, ytrain)
      return {
        predict: (X) => model.predict(X),
        score: nClasses === 2 ? (X) => model.predictProba(X) : undefined,
      }
    }
    case 'decision_tree': {
      const model = new DecisionTree({
        maxDepth: hyperParams.maxDepth ?? 6,
        minSamplesLeaf: hyperParams.minSamplesLeaf ?? 3,
        mode: isReg ? 'regression' : 'classification',
        nClasses: isReg ? undefined : nClasses,
      })
      model.fit(Xtrain, ytrain)
      return {
        predict: (X) => model.predict(X),
        // a single small tree doesn't produce genuine probabilities; hard predictions stand in,
        // consistent with how this model has always been scored here
        score: (X) => model.predict(X),
        featureImportanceRaw: model.featureImportance,
      }
    }
    case 'random_forest': {
      const model = new RandomForest({
        nEstimators: hyperParams.nEstimators ?? 100,
        maxDepth: hyperParams.maxDepth ?? 8,
        minSamplesLeaf: hyperParams.minSamplesLeaf ?? 2,
        mode: isReg ? 'regression' : 'classification',
        nClasses: isReg ? undefined : nClasses,
        seed,
      })
      model.fit(Xtrain, ytrain)
      return {
        predict: (X) => model.predict(X),
        score: isReg ? (X) => model.predict(X) : nClasses === 2 ? (X) => model.predictProba(X) : undefined,
        featureImportanceRaw: model.featureImportance,
      }
    }
    case 'knn': {
      const model = new KnnModel({
        k: hyperParams.k ?? 5,
        mode: isReg ? 'regression' : 'classification',
        nClasses: isReg ? undefined : nClasses,
      })
      model.fit(Xtrain, ytrain)
      return {
        predict: (X) => model.predict(X),
        score: isReg ? (X) => model.predict(X) : nClasses === 2 ? (X) => model.predictProba(X) : undefined,
      }
    }
    case 'gradient_boosting': {
      const model = new GradientBoosting({
        nEstimators: hyperParams.nEstimators ?? 80,
        learningRate: hyperParams.learningRate ?? 0.1,
        maxDepth: hyperParams.maxDepth ?? 3,
        mode: isReg ? 'regression' : 'classification',
      })
      model.fit(Xtrain, ytrain)
      return {
        predict: (X) => model.predict(X),
        score: isReg ? (X) => model.predict(X) : (X) => model.predictProba(X),
        featureImportanceRaw: model.featureImportance,
      }
    }
    default:
      throw new Error(`Model ${modelId} is not available for in-browser training.`)
  }
}

function trainSupervised(args: {
  dataset: Dataset
  taskType: TaskType
  modelId: ModelId
  targetColumn: string
  featureColumns: string[]
  hyperParams: HyperParams
  testSize: number
  seed: number
  columnTypeMap: Map<string, 'numeric' | 'categorical'>
  warnings: string[]
}): TrainedModelResult {
  const { dataset, taskType, modelId, targetColumn, featureColumns, hyperParams, testSize, seed, columnTypeMap, warnings } = args

  const { featureNames, X: rawX, sourceColumn, categoryLevels } = encodeFeatures(dataset.rows, featureColumns, columnTypeMap)
  const { Xs, means, stds } = standardize(rawX)
  const useScaled = SCALED_MODELS.has(modelId)
  const X = useScaled ? Xs : rawX

  let classLabels: string[] = []
  let y: number[] = []
  const rawTargets = dataset.rows.map((r) => r[targetColumn])

  if (taskType === 'classification') {
    classLabels = [...new Set(rawTargets.map((v) => String(v)))].sort()
    if (classLabels.length > 10) {
      warnings.push(
        `The column "${targetColumn}" has ${classLabels.length} different categories. Models tend to work best with fewer categories — consider grouping rare categories together.`
      )
    }
    const labelIndex = new Map(classLabels.map((l, i) => [l, i]))
    y = rawTargets.map((v) => labelIndex.get(String(v)) ?? 0)
  } else {
    y = rawTargets.map((v) => (typeof v === 'number' ? v : Number(v) || 0))
  }

  const nClasses = classLabels.length || 2

  const { trainIdx, testIdx } = trainTestSplit(X.length, testSize, seed)
  const Xtrain = trainIdx.map((i) => X[i])
  const ytrain = trainIdx.map((i) => y[i])
  const Xtest = testIdx.map((i) => X[i])
  const ytest = testIdx.map((i) => y[i])

  const fitted = fitModel(modelId, taskType, Xtrain, ytrain, hyperParams, seed, nClasses)
  const predictions = fitted.predict(Xtest)
  const probabilities =
    taskType === 'classification' && fitted.score && nClasses === 2 ? fitted.score(Xtest) : undefined

  const result: TrainedModelResult = {
    modelId,
    taskType,
    targetColumn,
    featureColumns,
    trainRowCount: Xtrain.length,
    testRowCount: Xtest.length,
    trainedAt: Date.now(),
    hyperParams,
    warnings,
  }

  if (taskType === 'regression') {
    result.regressionMetrics = regressionMetrics(ytest, predictions)
    result.predictions = predictions
    result.actuals = ytest
  } else {
    const actualLabels = ytest.map((v) => classLabels[v])
    const predictedLabels = predictions.map((v) => classLabels[v])
    result.classificationMetrics = classificationMetrics(actualLabels, predictedLabels, classLabels, probabilities)
    result.predictions = predictedLabels
    result.actuals = actualLabels
    result.probabilities = probabilities
  }

  // Original (unencoded) feature values for the held-out test rows, for CSV export.
  result.testRows = testIdx.map((i) => {
    const row: Record<string, CellValue> = {}
    for (const col of featureColumns) row[col] = dataset.rows[i][col]
    return row
  })

  if (fitted.featureImportanceRaw) {
    result.featureImportance = rollupFeatureImportance(fitted.featureImportanceRaw, featureNames, sourceColumn)
  }

  // Approximate SHAP values (Monte Carlo permutation sampling) — only when the model exposes
  // a continuous score, and the encoded feature count is small enough to stay fast in-browser.
  if (fitted.score && featureNames.length > 0 && featureNames.length <= 60 && Xtest.length > 0) {
    try {
      result.shapImportance = computeShapImportance({
        score: fitted.score,
        Xtrain,
        Xtest,
        featureNames,
        sourceColumn,
      })
    } catch {
      // SHAP is a supplementary explanation — never let it break the main results.
    }
  }

  const kFolds = hyperParams.kFolds
  if (kFolds && kFolds >= 2) {
    result.crossValidation = runCrossValidation({ X, y, modelId, taskType, hyperParams, seed, nClasses, kFolds })
  }

  // Fit one more model on ALL available rows (train + test), so the user can apply it to
  // brand-new data. Evaluation metrics above always come from the held-out split, never this one.
  const finalFit = fitModel(modelId, taskType, X, y, hyperParams, seed, nClasses)
  result.predictOnNewData = (newRows: Record<string, CellValue>[]): PredictNewDataResult =>
    predictWithSchema({
      newRows,
      featureColumns,
      columnTypeMap,
      categoryLevels,
      useScaled,
      means,
      stds,
      predict: finalFit.predict,
      taskType,
      classLabels,
    })

  return result
}

function runCrossValidation(args: {
  X: number[][]
  y: number[]
  modelId: ModelId
  taskType: TaskType
  hyperParams: HyperParams
  seed: number
  nClasses: number
  kFolds: number
}): CrossValidationResult {
  const { X, y, modelId, taskType, hyperParams, seed, nClasses, kFolds } = args
  const folds = kFoldSplit(X.length, kFolds, seed)
  const foldScores: number[] = []

  for (const { trainIdx, testIdx } of folds) {
    if (trainIdx.length === 0 || testIdx.length === 0) continue
    const Xtr = trainIdx.map((i) => X[i])
    const ytr = trainIdx.map((i) => y[i])
    const Xte = testIdx.map((i) => X[i])
    const yte = testIdx.map((i) => y[i])
    const fitted = fitModel(modelId, taskType, Xtr, ytr, hyperParams, seed, nClasses)
    const preds = fitted.predict(Xte)

    if (taskType === 'regression') {
      foldScores.push(regressionMetrics(yte, preds).r2)
    } else {
      let correct = 0
      for (let i = 0; i < yte.length; i++) if (yte[i] === preds[i]) correct++
      foldScores.push(yte.length ? correct / yte.length : 0)
    }
  }

  const mean = foldScores.reduce((a, b) => a + b, 0) / (foldScores.length || 1)
  const variance = foldScores.reduce((a, b) => a + (b - mean) ** 2, 0) / (foldScores.length || 1)

  return {
    folds: foldScores.length,
    metricName: taskType === 'regression' ? 'R²' : 'Accuracy',
    foldScores,
    meanScore: mean,
    stdScore: Math.sqrt(variance),
  }
}

function computeShapImportance(args: {
  score: (X: number[][]) => number[]
  Xtrain: number[][]
  Xtest: number[][]
  featureNames: string[]
  sourceColumn: string[]
}): FeatureImportance[] {
  const { score, Xtrain, Xtest, featureNames, sourceColumn } = args
  const nFeatures = featureNames.length
  if (nFeatures === 0 || Xtrain.length === 0) return []

  const background = new Array(nFeatures).fill(0)
  for (const row of Xtrain) for (let j = 0; j < nFeatures; j++) background[j] += row[j]
  for (let j = 0; j < nFeatures; j++) background[j] /= Xtrain.length

  const sampleSize = Math.min(20, Xtest.length)
  const samples = Xtest.slice(0, sampleSize)
  if (samples.length === 0) return []

  const phi = approximateShapValues({ predict: score, background, samples, permutations: 8, seed: 11 })

  const meanAbs = new Array(nFeatures).fill(0)
  for (const row of phi) for (let j = 0; j < nFeatures; j++) meanAbs[j] += Math.abs(row[j])
  for (let j = 0; j < nFeatures; j++) meanAbs[j] /= phi.length

  return rollupFeatureImportance(meanAbs, featureNames, sourceColumn)
}

function predictWithSchema(args: {
  newRows: Record<string, CellValue>[]
  featureColumns: string[]
  columnTypeMap: Map<string, 'numeric' | 'categorical'>
  categoryLevels: Map<string, string[]>
  useScaled: boolean
  means: number[]
  stds: number[]
  predict: (X: number[][]) => number[]
  taskType: TaskType
  classLabels: string[]
}): PredictNewDataResult {
  const { newRows, featureColumns, columnTypeMap, categoryLevels, useScaled, means, stds, predict, taskType, classLabels } =
    args

  const firstRow = newRows[0] ?? {}
  const unmatchedColumns = featureColumns.filter((c) => !(c in firstRow))

  const { X: rawX } = encodeFeatures(newRows, featureColumns, columnTypeMap, categoryLevels)
  const X = useScaled ? applyStandardize(rawX, means, stds) : rawX
  const raw = predict(X)

  if (taskType === 'classification') {
    return { predictions: raw.map((v) => classLabels[v] ?? String(v)), unmatchedColumns }
  }
  return { predictions: raw, unmatchedColumns }
}

function trainClustering(args: {
  dataset: Dataset
  modelId: ModelId
  featureColumns: string[]
  hyperParams: HyperParams
  seed: number
  columnTypeMap: Map<string, 'numeric' | 'categorical'>
  warnings: string[]
}): TrainedModelResult {
  const { dataset, modelId, featureColumns, hyperParams, seed, columnTypeMap, warnings } = args
  const { X: rawX } = encodeFeatures(dataset.rows, featureColumns, columnTypeMap)
  const { Xs } = standardize(rawX)

  let labels: number[] = []

  if (modelId === 'kmeans') {
    const model = new KMeans({ nClusters: hyperParams.nClusters ?? 3, seed })
    labels = model.fit(Xs)
  } else if (modelId === 'dbscan') {
    const minPoints = hyperParams.minPoints ?? 5
    const eps = hyperParams.eps ?? suggestEps(Xs, minPoints)
    labels = dbscan(Xs, { eps, minPoints })
    const noiseCount = labels.filter((l) => l === -1).length
    if (noiseCount === Xs.length) {
      warnings.push(
        'DBSCAN marked every point as noise. Try increasing the neighborhood distance in Advanced Options, or use K-Means instead.'
      )
    }
  } else {
    throw new Error(`Clustering model ${modelId} is not available.`)
  }

  const clusterCounts = new Map<number, number>()
  for (const l of labels) clusterCounts.set(l, (clusterCounts.get(l) ?? 0) + 1)
  const clusterSizes = [...clusterCounts.entries()]
    .filter(([c]) => c !== -1)
    .sort((a, b) => a[0] - b[0])
    .map(([cluster, count]) => ({ cluster, count }))

  const silhouette = new Set(labels.filter((l) => l !== -1)).size >= 2 ? silhouetteScore(Xs, labels) : undefined

  const projected = pca2d(Xs)
  const pca2dResult = projected.map((p, i) => ({ x: p.x, y: p.y, cluster: labels[i] }))

  return {
    modelId,
    taskType: 'clustering',
    featureColumns,
    clusterAssignments: labels,
    pca2d: pca2dResult,
    clusteringMetrics: {
      silhouetteScore: silhouette,
      clusterSizes,
      nClusters: clusterSizes.length,
      noiseCount: modelId === 'dbscan' ? labels.filter((l) => l === -1).length : undefined,
    },
    trainedAt: Date.now(),
    hyperParams,
    warnings,
  }
}

function rollupFeatureImportance(raw: number[], featureNames: string[], sourceColumn: string[]): FeatureImportance[] {
  const byColumn = new Map<string, number>()
  for (let i = 0; i < raw.length; i++) {
    const col = sourceColumn[i] ?? featureNames[i]
    byColumn.set(col, (byColumn.get(col) ?? 0) + raw[i])
  }
  const total = [...byColumn.values()].reduce((a, b) => a + b, 0) || 1
  return [...byColumn.entries()]
    .map(([feature, importance]) => ({ feature, importance: importance / total }))
    .sort((a, b) => b.importance - a.importance)
}

export function isRowCountSufficient(rowCount: number): boolean {
  return rowCount >= MIN_ROWS_FOR_RELIABLE_TRAINING
}

export type { CellValue }
