import type { ModelMeta, TaskType } from '../types'

export const MODEL_REGISTRY: ModelMeta[] = [
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    shortName: 'Linear Regression',
    category: 'classical',
    supports: ['regression'],
    summary: 'A simple, interpretable starting point that fits a straight-line relationship.',
    whatItDoes: 'Finds the straight-line relationship between your inputs and the number you want to predict.',
    whenUseful: 'Great first model to try, especially when relationships in your data are roughly linear.',
    strength: 'Fast, easy to interpret, and a good baseline to compare other models against.',
    limitation: 'Struggles with complex, curved, or interacting relationships between variables.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
  {
    id: 'ridge_regression',
    name: 'Ridge Regression',
    shortName: 'Ridge Regression',
    category: 'classical',
    supports: ['regression'],
    summary: 'Linear Regression with a penalty that discourages overly large coefficients.',
    whatItDoes: 'Fits a straight-line relationship like Linear Regression, but shrinks the coefficients to keep the model more stable.',
    whenUseful: 'Useful when your columns are correlated with each other, or when you have a smaller dataset and plain Linear Regression feels unstable.',
    strength: 'More resistant to overfitting than plain Linear Regression, especially with correlated features.',
    limitation: 'Still assumes a roughly linear relationship, and the regularization strength needs some tuning.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    shortName: 'Logistic Regression',
    category: 'classical',
    supports: ['classification'],
    summary: 'A simple, interpretable starting point for predicting categories.',
    whatItDoes: 'Estimates the probability that a row belongs to each category using a straight decision boundary.',
    whenUseful: 'Great first model to try for two-category problems, or when you want a clear, explainable model.',
    strength: 'Fast, interpretable, and produces genuine probability estimates.',
    limitation: 'Struggles when categories are separated by complex, curved boundaries.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: true,
  },
  {
    id: 'naive_bayes',
    name: 'Naive Bayes',
    shortName: 'Naive Bayes',
    category: 'classical',
    supports: ['classification'],
    summary: 'A fast, probability-based classifier that assumes columns don\u2019t interact with each other.',
    whatItDoes: 'Estimates how likely each category is by looking at each column\u2019s typical values for that category, then combines those probabilities.',
    whenUseful: 'A quick, lightweight baseline, especially useful with many columns or limited data.',
    strength: 'Very fast to train, works reasonably well even with little data, and produces genuine probabilities.',
    limitation: 'Assumes columns are independent of each other, which is rarely exactly true and can limit accuracy.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: true,
  },
  {
    id: 'decision_tree',
    name: 'Decision Tree',
    shortName: 'Decision Tree',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'Learns a series of simple questions and decisions from your data.',
    whatItDoes: 'Splits your data step by step using simple yes/no questions about your columns, ending in a prediction.',
    whenUseful: 'Useful when you want a model whose decisions are easy to explain and trace.',
    strength: 'Easy to visualize and explain; handles non-linear patterns.',
    limitation: 'Can overfit small datasets and be less stable than ensemble methods.',
    requiresBackend: false,
    supportsFeatureImportance: true,
    supportsProbabilities: true,
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    shortName: 'Random Forest',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'Combines many decision trees to make predictions and can capture more complex patterns than a single tree.',
    whatItDoes: 'Builds many different decision trees on random slices of your data and averages their predictions.',
    whenUseful: 'A reliable, well-rounded choice for most tabular datasets, especially with mixed data types.',
    strength: 'Handles complex patterns well and is less prone to overfitting than a single tree.',
    limitation: 'Understanding exactly why it made a specific prediction can be more difficult.',
    requiresBackend: false,
    supportsFeatureImportance: true,
    supportsProbabilities: true,
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    shortName: 'K-Nearest Neighbors',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'Makes predictions by looking at the observations that are most similar to the one being analyzed.',
    whatItDoes: 'Finds the most similar rows in your training data and bases its prediction on them.',
    whenUseful: 'Useful for smaller datasets where similar rows genuinely tend to have similar outcomes.',
    strength: 'Simple, intuitive, and requires no assumptions about the shape of the data.',
    limitation: 'Can be slow on large datasets and sensitive to unrelated or unscaled columns.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: true,
  },
  {
    id: 'gradient_boosting',
    name: 'Gradient Boosting',
    shortName: 'Gradient Boosting',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'Builds models step by step, with each new model trying to improve on earlier mistakes.',
    whatItDoes: 'Trains a sequence of small decision trees, where each tree corrects the errors left by the ones before it.',
    whenUseful: 'Often achieves strong accuracy on structured, tabular data when tuned carefully.',
    strength: 'Frequently among the most accurate options for tabular data.',
    limitation: 'More settings to tune, slower to train, and can overfit if pushed too far.',
    requiresBackend: false,
    supportsFeatureImportance: true,
    supportsProbabilities: true,
  },
  {
    id: 'svm',
    name: 'Support Vector Machine',
    shortName: 'SVM / SVR',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'Finds the boundary or trend line that best separates or fits your data with the widest margin.',
    whatItDoes: 'Looks for the decision boundary (classification) or trend (regression) that stays as far as possible from the data points.',
    whenUseful: 'Can work well on smaller, cleanly-separated datasets.',
    strength: 'Effective in high-dimensional spaces and with clear margins between groups.',
    limitation: 'A reliable, fast implementation is difficult to run entirely in the browser — DataForge ML gives you ready-to-run Python code for this model instead of training it here.',
    requiresBackend: true,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    shortName: 'XGBoost',
    category: 'classical',
    supports: ['regression', 'classification'],
    summary: 'A highly optimized, industry-standard version of gradient boosting.',
    whatItDoes: 'Builds an optimized sequence of trees using techniques that make it fast and highly accurate on tabular data.',
    whenUseful: 'A strong choice for competitions and production tabular-data problems.',
    strength: 'Extremely widely used and often top-performing on structured data.',
    limitation: 'Its optimized training engine is not practical to run reliably in a browser — DataForge ML gives you ready-to-run Python code for this model instead of training it here.',
    requiresBackend: true,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
  {
    id: 'kmeans',
    name: 'K-Means Clustering',
    shortName: 'K-Means',
    category: 'unsupervised',
    supports: ['clustering'],
    summary: 'Finds groups of observations that are similar to each other.',
    whatItDoes: 'Splits your data into a chosen number of groups so that observations in the same group are close together.',
    whenUseful: 'A good starting point for finding natural groupings when you have a rough idea of how many groups to expect.',
    strength: 'Fast, simple to understand, and works well when groups are roughly round and evenly sized.',
    limitation: 'You must choose the number of groups in advance, and it struggles with unusually shaped groups.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
  {
    id: 'dbscan',
    name: 'DBSCAN',
    shortName: 'DBSCAN',
    category: 'unsupervised',
    supports: ['clustering'],
    summary: 'Can find groups with more unusual shapes and can identify observations that do not fit into a group.',
    whatItDoes: 'Groups together points that are packed closely, and marks isolated points as outliers rather than forcing them into a group.',
    whenUseful: 'Useful when your groups are irregularly shaped, or when you expect some outliers or noise.',
    strength: "Does not require choosing the number of groups, and it explicitly flags outliers.",
    limitation: 'Sensitive to its distance settings, and can struggle when groups have very different densities.',
    requiresBackend: false,
    supportsFeatureImportance: false,
    supportsProbabilities: false,
  },
]

export function getModelsForTask(task: TaskType): ModelMeta[] {
  return MODEL_REGISTRY.filter((m) => m.supports.includes(task))
}

export function getAvailableModelsForTask(task: TaskType): ModelMeta[] {
  return getModelsForTask(task).filter((m) => !m.requiresBackend)
}

export function getModelMeta(id: string): ModelMeta | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

/** Recommends a genuinely available model for a given task, with a plain-language reason. */
export function recommendModel(task: TaskType, rowCount: number): { model: ModelMeta; reason: string } {
  const available = getAvailableModelsForTask(task)

  if (task === 'clustering') {
    const model = available.find((m) => m.id === 'kmeans')!
    return {
      model,
      reason:
        'K-Means is an easy-to-understand starting point for discovering groups in your data. You can try DBSCAN afterwards to compare.',
    }
  }

  // Prefer Random Forest for most tabular tasks — a well-rounded, reliable default —
  // unless the dataset is very small, where a simpler model tends to generalize better.
  if (rowCount < 60) {
    const model = available.find((m) => (task === 'regression' ? m.id === 'linear_regression' : m.id === 'logistic_regression'))!
    return {
      model,
      reason:
        'Your dataset is fairly small, so we recommend starting with a simple model that is less likely to overfit.',
    }
  }

  const model = available.find((m) => m.id === 'random_forest')!
  return {
    model,
    reason:
      'Random Forest is a reliable, well-rounded choice that works well on many types of data and is a strong default to start with.',
  }
}
