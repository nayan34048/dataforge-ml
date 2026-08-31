// Gaussian Naive Bayes — a genuine, from-scratch classifier. Assumes each feature is
// roughly normally distributed within each class, and treats features as independent
// given the class (the "naive" assumption). Fast, and a good baseline for tabular data.

export interface NaiveBayesOptions {
  nClasses: number
}

export class GaussianNaiveBayes {
  classMeans: number[][] = []
  classVariances: number[][] = []
  classPriors: number[] = []
  options: NaiveBayesOptions

  constructor(options: NaiveBayesOptions) {
    this.options = options
  }

  fit(X: number[][], y: number[]) {
    const nFeatures = X[0]?.length ?? 0
    const nClasses = this.options.nClasses
    const counts = new Array(nClasses).fill(0)

    this.classMeans = Array.from({ length: nClasses }, () => new Array(nFeatures).fill(0))
    this.classVariances = Array.from({ length: nClasses }, () => new Array(nFeatures).fill(1))

    for (let i = 0; i < X.length; i++) {
      counts[y[i]]++
      for (let j = 0; j < nFeatures; j++) this.classMeans[y[i]][j] += X[i][j]
    }
    for (let c = 0; c < nClasses; c++) {
      if (counts[c] > 0) for (let j = 0; j < nFeatures; j++) this.classMeans[c][j] /= counts[c]
    }

    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < nFeatures; j++) {
        const d = X[i][j] - this.classMeans[y[i]][j]
        this.classVariances[y[i]][j] += d * d
      }
    }
    for (let c = 0; c < nClasses; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < nFeatures; j++) {
          this.classVariances[c][j] = Math.max(this.classVariances[c][j] / counts[c], 1e-6)
        }
      }
    }

    const total = X.length || 1
    // Laplace-smoothed class priors so an unseen class doesn't get a zero probability
    this.classPriors = counts.map((c) => (c + 1) / (total + nClasses))
  }

  private logLikelihood(x: number[], c: number): number {
    let ll = Math.log(this.classPriors[c])
    for (let j = 0; j < x.length; j++) {
      const mean = this.classMeans[c][j]
      const variance = this.classVariances[c][j]
      ll += -0.5 * Math.log(2 * Math.PI * variance) - (x[j] - mean) ** 2 / (2 * variance)
    }
    return ll
  }

  private probaMatrix(X: number[][]): number[][] {
    return X.map((x) => {
      const scores = Array.from({ length: this.options.nClasses }, (_, c) => this.logLikelihood(x, c))
      const max = Math.max(...scores)
      const exp = scores.map((s) => Math.exp(s - max))
      const sum = exp.reduce((a, b) => a + b, 0) || 1
      return exp.map((e) => e / sum)
    })
  }

  predict(X: number[][]): number[] {
    return this.probaMatrix(X).map((probs) => {
      let best = 0
      let bestP = -1
      probs.forEach((p, c) => {
        if (p > bestP) {
          bestP = p
          best = c
        }
      })
      return best
    })
  }

  /** Probability of class index 1 — meaningful for binary classification. */
  predictProba(X: number[][]): number[] {
    return this.probaMatrix(X).map((p) => p[1] ?? 0)
  }
}
