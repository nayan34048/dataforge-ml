import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type { AppSettings, Dataset, Goal, HyperParams, ModelId, TaskType, TrainedModelResult } from '../types'

export type Step = 'upload' | 'goal' | 'target' | 'model' | 'train' | 'results'

interface AppState {
  step: Step
  dataset: Dataset | null
  goal: Goal | null
  taskType: TaskType | null
  targetColumn: string | null
  /** Extra target columns to train the same model against, one at a time (each produces its own result). */
  additionalTargetColumns: string[]
  featureColumns: string[]
  modelId: ModelId | null
  modelMode: 'easy' | 'advanced'
  hyperParams: HyperParams
  results: TrainedModelResult[]
  activeResultIndex: number
  settings: AppSettings
  isTraining: boolean
  trainingError: string | null
  darkMode: boolean
}

interface AppContextValue extends AppState {
  setStep: (step: Step) => void
  setDataset: (dataset: Dataset | null) => void
  setGoal: (goal: Goal) => void
  setTaskType: (taskType: TaskType) => void
  setTargetColumn: (col: string | null) => void
  setAdditionalTargetColumns: (cols: string[]) => void
  setFeatureColumns: (cols: string[]) => void
  setModelId: (id: ModelId | null) => void
  setModelMode: (mode: 'easy' | 'advanced') => void
  setHyperParams: (hp: HyperParams) => void
  addResult: (result: TrainedModelResult) => void
  setActiveResultIndex: (i: number) => void
  clearResults: () => void
  setIsTraining: (b: boolean) => void
  setTrainingError: (e: string | null) => void
  toggleDarkMode: () => void
  resetWorkflow: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const initialState: AppState = {
  step: 'upload',
  dataset: null,
  goal: null,
  taskType: null,
  targetColumn: null,
  additionalTargetColumns: [],
  featureColumns: [],
  modelId: null,
  modelMode: 'easy',
  hyperParams: {},
  results: [],
  activeResultIndex: -1,
  settings: { randomSeed: 42, testSize: 0.2 },
  isTraining: false,
  trainingError: null,
  darkMode: typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)').matches : false,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)

  const setStep = useCallback((step: Step) => setState((s) => ({ ...s, step })), [])
  const setDataset = useCallback(
    (dataset: Dataset | null) =>
      setState((s) => ({
        ...s,
        dataset,
        goal: null,
        taskType: null,
        targetColumn: null,
        additionalTargetColumns: [],
        featureColumns: [],
        modelId: null,
        results: [],
        activeResultIndex: -1,
      })),
    []
  )
  const setGoal = useCallback((goal: Goal) => setState((s) => ({ ...s, goal })), [])
  const setTaskType = useCallback((taskType: TaskType) => setState((s) => ({ ...s, taskType })), [])
  const setTargetColumn = useCallback((col: string | null) => setState((s) => ({ ...s, targetColumn: col })), [])
  const setAdditionalTargetColumns = useCallback(
    (cols: string[]) => setState((s) => ({ ...s, additionalTargetColumns: cols })),
    []
  )
  const setFeatureColumns = useCallback((cols: string[]) => setState((s) => ({ ...s, featureColumns: cols })), [])
  const setModelId = useCallback((id: ModelId | null) => setState((s) => ({ ...s, modelId: id })), [])
  const setModelMode = useCallback((mode: 'easy' | 'advanced') => setState((s) => ({ ...s, modelMode: mode })), [])
  const setHyperParams = useCallback((hp: HyperParams) => setState((s) => ({ ...s, hyperParams: hp })), [])
  const addResult = useCallback(
    (result: TrainedModelResult) =>
      setState((s) => ({ ...s, results: [...s.results, result], activeResultIndex: s.results.length })),
    []
  )
  const setActiveResultIndex = useCallback((i: number) => setState((s) => ({ ...s, activeResultIndex: i })), [])
  const clearResults = useCallback(() => setState((s) => ({ ...s, results: [], activeResultIndex: -1 })), [])
  const setIsTraining = useCallback((b: boolean) => setState((s) => ({ ...s, isTraining: b })), [])
  const setTrainingError = useCallback((e: string | null) => setState((s) => ({ ...s, trainingError: e })), [])
  const toggleDarkMode = useCallback(() => setState((s) => ({ ...s, darkMode: !s.darkMode })), [])
  const resetWorkflow = useCallback(() => setState((s) => ({ ...initialState, darkMode: s.darkMode })), [])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setStep,
      setDataset,
      setGoal,
      setTaskType,
      setTargetColumn,
      setAdditionalTargetColumns,
      setFeatureColumns,
      setModelId,
      setModelMode,
      setHyperParams,
      addResult,
      setActiveResultIndex,
      clearResults,
      setIsTraining,
      setTrainingError,
      toggleDarkMode,
      resetWorkflow,
    }),
    [state, setStep, setDataset, setGoal, setTaskType, setTargetColumn, setAdditionalTargetColumns, setFeatureColumns, setModelId, setModelMode, setHyperParams, addResult, setActiveResultIndex, clearResults, setIsTraining, setTrainingError, toggleDarkMode, resetWorkflow]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
