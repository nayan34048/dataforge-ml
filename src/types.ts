// Core shared types for DataForge ML

export type ColumnType = 'numeric' | 'categorical'

export interface ColumnSummary {
  name: string
  type: ColumnType
  missingCount: number
  uniqueCount: number
  // numeric stats
  min?: number
  max?: number
  mean?: number
  median?: number
  stdDev?: number
  // categorical stats
  topCategories?: { value: string; count: number }[]
}

export interface DatasetAnalysis {
  rowCount: number
  columnCount: number
  numericColumns: string[]
  categoricalColumns: string[]
  columns: ColumnSummary[]
  hasMissingValues: boolean
  totalMissingCells: number
}

export type CellValue = number | string | null

export interface Dataset {
  name: string
  columns: string[]
  rows: Record<string, CellValue>[]
  analysis: DatasetAnalysis
}

export type Goal = 'predict' | 'explore'

export type TaskType = 'regression' | 'classification' | 'clustering'

export type PrepAction =
  | { kind: 'dropMissingRows' }
  | { kind: 'fillMissingNumeric' }
  | { kind: 'dropColumns'; columns: string[] }
  | { kind: 'scaleFeatures' }

export type ModelId =
  | 'linear_regression'
  | 'ridge_regression'
  | 'logistic_regression'
  | 'naive_bayes'
  | 'decision_tree'
  | 'random_forest'
  | 'knn'
  | 'gradient_boosting'
  | 'svm'
  | 'xgboost'
  | 'kmeans'
  | 'dbscan'

export interface ModelMeta {
  id: ModelId
  name: string
  shortName: string
  category: 'classical' | 'unsupervised'
  supports: TaskType[]
  summary: string
  whatItDoes: string
  whenUseful: string
  strength: string
  limitation: string
  requiresBackend: boolean
  supportsFeatureImportance: boolean
  supportsProbabilities: boolean
}

export interface HyperParams {
  // shared
  randomSeed?: number
  // tree based
  maxDepth?: number
  minSamplesLeaf?: number
  nEstimators?: number
  learningRate?: number
  // knn
  k?: number
  // clustering
  nClusters?: number
  eps?: number
  minPoints?: number
  // ridge regression
  alpha?: number
  // cross-validation
  kFolds?: number
}

export interface RegressionMetrics {
  mae: number
  rmse: number
  r2: number
}

export interface ClassificationMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  confusionMatrix: number[][]
  classLabels: string[]
  rocAuc?: number
  rocCurve?: { fpr: number; tpr: number }[]
  prCurve?: { recall: number; precision: number }[]
}

export interface ClusteringMetrics {
  silhouetteScore?: number
  clusterSizes: { cluster: number; count: number }[]
  nClusters: number
  noiseCount?: number
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface CrossValidationResult {
  folds: number
  metricName: string
  foldScores: number[]
  meanScore: number
  stdScore: number
}

export interface PredictNewDataResult {
  predictions: (number | string)[]
  unmatchedColumns: string[]
}

export interface TrainedModelResult {
  modelId: ModelId
  taskType: TaskType
  targetColumn?: string
  featureColumns: string[]
  regressionMetrics?: RegressionMetrics
  classificationMetrics?: ClassificationMetrics
  clusteringMetrics?: ClusteringMetrics
  featureImportance?: FeatureImportance[]
  /** Approximate SHAP-style attribution (Monte Carlo permutation sampling), computed in-browser. */
  shapImportance?: FeatureImportance[]
  crossValidation?: CrossValidationResult
  predictions?: (number | string)[]
  actuals?: (number | string)[]
  probabilities?: number[]
  /** Original (unencoded) feature values for the held-out test rows, aligned with predictions/actuals. */
  testRows?: Record<string, CellValue>[]
  clusterAssignments?: number[]
  pca2d?: { x: number; y: number; cluster: number }[]
  trainRowCount?: number
  testRowCount?: number
  trainedAt: number
  hyperParams: HyperParams
  warnings: string[]
  /** True when this "result" is a stub for a model that requires a Python backend — no metrics, just generated code. */
  isCodeOnly?: boolean
  /** Bound to a model trained on the full dataset; lets the user apply it to a fresh CSV. Not serializable — runtime only. */
  predictOnNewData?: (rows: Record<string, CellValue>[]) => PredictNewDataResult
}

export interface AppSettings {
  randomSeed: number
  testSize: number // e.g. 0.2
}
