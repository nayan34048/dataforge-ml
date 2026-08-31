import { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { StepRail } from './components/StepRail'
import { UploadStep } from './components/UploadStep'
import { DataPreview } from './components/DataPreview'
import { GoalSelection } from './components/GoalSelection'
import { TargetSelection } from './components/TargetSelection'
import { ModelSelection } from './components/ModelSelection'
import { TrainingStep } from './components/TrainingStep'
import { ResultsStep } from './components/ResultsStep'

function Shell() {
  const { step, dataset, darkMode } = useApp()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <StepRail />
        <main className="flex-1 min-w-0">
          {step === 'upload' && (dataset ? <DataPreview /> : <UploadStep />)}
          {step === 'goal' && <GoalSelection />}
          {step === 'target' && <TargetSelection />}
          {step === 'model' && <ModelSelection />}
          {step === 'train' && <TrainingStep />}
          {step === 'results' && <ResultsStep />}
        </main>
      </div>
      <footer className="border-t border-border dark:border-border-dark px-6 py-6 text-center text-xs text-ink-soft dark:text-mist-soft sm:px-10">
        DataForge ML runs entirely in your browser. Your data is never uploaded to a server.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
