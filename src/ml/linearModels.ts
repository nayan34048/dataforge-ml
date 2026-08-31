// Linear Regression (ordinary least squares via gradient descent) and
// Logistic Regression (binary, via gradient descent on standardized features).

export interface LinearRegressionOptions {
  learningRate?: number
  epochs?: number
}

export class LinearRegression {
  weights: number[] = []
  bias = 0

  fit(X: number[][], y: number[], options: LinearRegressionOptions = {}) {
    const lr = options.learningRate ?? 0.05
    const epochs = options.epochs ?? 500
    const n = X.length
    const nFeatures = X[0]?.length ?? 0
    this.weights = new Array(nFeatures).fill(0)
    this.bias = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Array(nFeatures).fill(0)
      let gradB = 0
      for (let i = 0; i < n; i++) {
        const pred = dot(this.weights, X[i]) + this.bias
        const err = pred - y[i]
        for (let j = 0; j < nFeatures; j++) gradW[j] += err * X[i][j]
        gradB += err
      }
      for (let j = 0; j < nFeatures; j++) this.weights[j] -= (lr * gradW[j]) / n
      this.bias -= (lr * gradB) / n
    }
  }

  predict(X: number[][]): number[] {
    return X.map((x) => dot(this.weights, x) + this.bias)
  }
}

export interface RidgeRegressionOptions {
  learningRate?: number
  epochs?: number
  /** L2 regularization strength. Larger values shrink coefficients more aggressively,
   * trading a little training fit for a model that's less likely to overfit. */
  alpha?: number
}

/** Ridge Regression — ordinary least squares with an L2 penalty on the coefficients.
 * Useful when features are correlated or a dataset is small, where plain Linear
 * Regression can produce large, unstable coefficients. */
export class RidgeRegression {
  weights: number[] = []
  bias = 0

  fit(X: number[][], y: number[], options: RidgeRegressionOptions = {}) {
    const lr = options.learningRate ?? 0.05
    const epochs = options.epochs ?? 600
    const alpha = options.alpha ?? 1.0
    const n = X.length
    const nFeatures = X[0]?.length ?? 0
    this.weights = new Array(nFeatures).fill(0)
    this.bias = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Array(nFeatures).fill(0)
      let gradB = 0
      for (let i = 0; i < n; i++) {
        const pred = dot(this.weights, X[i]) + this.bias
        const err = pred - y[i]
        for (let j = 0; j < nFeatures; j++) gradW[j] += err * X[i][j]
        gradB += err
      }
      // the alpha * weight term is the L2 penalty gradient (bias is left unregularized)
      for (let j = 0; j < nFeatures; j++) this.weights[j] -= lr * (gradW[j] / n + alpha * this.weights[j])
      this.bias -= (lr * gradB) / n
    }
  }

  predict(X: number[][]): number[] {
    return X.map((x) => dot(this.weights, x) + this.bias)
  }
}

export interface LogisticRegressionOptions {
  learningRate?: number
  epochs?: number
}

export class LogisticRegression {
  weights: number[] = []
  bias = 0

  fit(X: number[][], y: number[], options: LogisticRegressionOptions = {}) {
    const lr = options.learningRate ?? 0.1
    const epochs = options.epochs ?? 800
    const n = X.length
    const nFeatures = X[0]?.length ?? 0
    this.weights = new Array(nFeatures).fill(0)
    this.bias = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      const gradW = new Array(nFeatures).fill(0)
      let gradB = 0
      for (let i = 0; i < n; i++) {
        const z = dot(this.weights, X[i]) + this.bias
        const pred = sigmoid(z)
        const err = pred - y[i]
        for (let j = 0; j < nFeatures; j++) gradW[j] += err * X[i][j]
        gradB += err
      }
      for (let j = 0; j < nFeatures; j++) this.weights[j] -= (lr * gradW[j]) / n
      this.bias -= (lr * gradB) / n
    }
  }

  predictProba(X: number[][]): number[] {
    return X.map((x) => sigmoid(dot(this.weights, x) + this.bias))
  }

  predict(X: number[][], threshold = 0.5): number[] {
    return this.predictProba(X).map((p) => (p >= threshold ? 1 : 0))
  }
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}
