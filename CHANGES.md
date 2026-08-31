# Changes in this update

Summary of the 9 requested modifications. See inline code comments for details.

1. **Deep learning model removed** — `src/ml/mlp.ts` deleted; all references removed from
   the model registry, trainer, Python code generator, and training UI.

2. **XGBoost / SVM → Python code instead of disabled** — these are still listed as models
   (`src/ml/modelRegistry.ts`), but selecting one now skips in-browser training and takes
   you straight to generated Python (pandas + scikit-learn) code
   (`src/components/ResultsStep.tsx`'s `isCodeOnly` branch, `src/utils/pythonCodeGen.ts`).

3. **K-fold cross-validation** — toggle + fold count in Advanced Options
   (`src/components/TrainingStep.tsx`), with a suggested fold count based on dataset size
   (`suggestKFolds` in `src/utils/random.ts`). Computed in `src/ml/trainer.ts`
   (`runCrossValidation`) and shown as a chart (`src/components/CrossValidationCard.tsx`).
   Also mirrored in the generated Python code via `cross_val_score`.

4. **Two new classical models** — Gaussian Naive Bayes (`src/ml/naiveBayes.ts`) and Ridge
   Regression (`RidgeRegression` in `src/ml/linearModels.ts`), both implemented from
   scratch, not stubs.

5. **Approximate SHAP** — Monte Carlo permutation-sampling Shapley value approximation
   (`src/ml/shap.ts`), computed from the trained model's own predictions in-browser and
   shown in the "Understand Results" tab (`src/components/Explainability.tsx`). Explicitly
   labeled as an approximation, and left blank (never fabricated) when unsupported.

6. **CSV export of actual vs. predicted + features** — interactive sortable/searchable
   table with a "Download CSV" button (`src/components/PredictionsTable.tsx`), shown under
   Results for regression and classification.

7. **Predict on new data** — upload a second CSV with the same feature columns (no target
   column needed); the model — refit on the *entire* original dataset with the same
   encoding/scaling — fills in predictions, downloadable as CSV
   (`src/components/PredictNewData.tsx`, `predictOnNewData` closure built in
   `src/ml/trainer.ts`).

8. **Multiple targets at once** — pick more than one target column in
   `src/components/TargetSelection.tsx` (restricted to columns with the same suggested
   task type); `src/components/TrainingStep.tsx` trains one model per target and adds each
   as its own result, reusing the existing multi-result comparison UI.

9. **More interactive results** — the new predictions table (sort, search, filter to
   mistakes only, pagination) and the cross-validation fold chart.

## Before you ship this

This was built and reviewed without network access, so **no `npm install` / `npm run build`
was run against it**. Please do that first:

```bash
npm install
npm run build   # or npm run dev to check it in the browser
```

The most likely trouble spots (if any) are in the `.tsx` files rather than the core
`src/ml/trainer.ts` logic, which got the most careful manual review.
