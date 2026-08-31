# DataForge ML

A beginner-friendly, browser-based machine learning workbench. Upload a spreadsheet, answer a few plain-language questions, and build a genuine machine learning model — no programming, installation, or math background required.

Everything runs client-side. Your data never leaves your browser; there is no backend, database, or API key involved.

## What it does

- **Upload data** — drag and drop a CSV, or try one of three built-in example datasets (house prices, customer churn, customer segments).
- **Choose a goal** — *Make a prediction* (regression/classification) or *Explore patterns* (clustering).
- **Pick what to predict or explore** — plain-language guidance suggests whether you're solving a regression or classification problem.
- **Build a model** — use the recommended model, or browse and choose from Classical ML, Unsupervised Learning, and Deep Learning categories, each with a short "what it does / when to use it / strengths / limitations" panel.
- **See real results** — genuine metrics (MAE, RMSE, R², Accuracy, Precision, Recall, F1, ROC-AUC, Silhouette Score) and charts (Actual vs Predicted, Residuals, Confusion Matrix, ROC/PR curves, cluster visualizations), computed from real held-out test data — never fabricated.
- **Understand results** — genuine feature importance for models that support it (never simulated).
- **Copy Python code** — optional, reproducible pandas + scikit-learn code mirroring your exact workflow.

### Models

All models below run entirely in the browser, implemented from scratch in TypeScript:

- Linear Regression, Logistic Regression
- Decision Tree (regression & classification)
- Random Forest (regression & classification)
- K-Nearest Neighbors (regression & classification)
- Gradient Boosting (regression & classification)
- Neural Network / MLP (regression & classification)
- K-Means Clustering
- DBSCAN Clustering

SVM/SVR and XGBoost are listed in the Advanced model picker but clearly labeled **"Requires backend"** — a reliable, fast implementation isn't practical fully in-browser, so instead of faking results, DataForge ML is upfront about the limitation and generates equivalent Python code you can run yourself.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Plotly.js for charts
- Papa Parse for CSV parsing
- No backend, no database, no auth, no API keys

## Getting started locally

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
```

This outputs a fully static site to `dist/` — just HTML, CSS, and JS. Deploy that folder anywhere that serves static files.

## Deploying

### Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`

### Netlify
- A `netlify.toml` is already included (build command `npm run build`, publish directory `dist`, with SPA redirect rules).
- Or drag-and-drop the `dist/` folder after running `npm run build` locally.

### GitHub Pages
- A ready-to-use GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`. Push to `main` and enable GitHub Pages ("GitHub Actions" source) in your repo settings — it will build and deploy automatically.
- Alternatively, run `npm run build` and publish the `dist/` folder with any static hosting method you prefer.

## Project structure

```
src/
  ml/            genuine model implementations + training orchestrator
  utils/         CSV parsing, preprocessing, metrics, Python code generation
  components/    step-by-step wizard UI
  context/       app state
  data/          built-in example datasets
```

## Notes on scientific honesty

This app never fabricates predictions, metrics, feature importance, or SHAP values. Where a genuine in-browser implementation isn't practical (SVM, XGBoost, full SHAP analysis), that is stated plainly in the UI rather than simulated, and the generated Python code shows how to run it with a real backend.
