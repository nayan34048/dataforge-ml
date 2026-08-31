import { useApp, type Step } from '../context/AppContext'

interface StepDef {
  id: Step
  label: string
}

export function StepRail() {
  const { step, dataset, goal, targetColumn, featureColumns, modelId, results, setStep, taskType } = useApp()

  if (!dataset) return null

  const steps: StepDef[] = [
    { id: 'upload', label: 'My Data' },
    { id: 'goal', label: 'Choose Your Goal' },
    { id: 'target', label: taskType === 'clustering' ? 'Columns to Explore' : 'What to Predict' },
    { id: 'model', label: 'Build Model' },
    { id: 'train', label: taskType === 'clustering' ? 'Find Patterns' : 'Train' },
    { id: 'results', label: 'Understand Results' },
  ]

  const isReachable = (id: Step): boolean => {
    if (id === 'upload') return true
    if (id === 'goal') return !!dataset
    if (id === 'target') return !!goal
    if (id === 'model') return !!targetColumn || (goal === 'explore' && featureColumns.length > 0)
    if (id === 'train') return !!modelId
    if (id === 'results') return results.length > 0
    return false
  }

  return (
    <nav aria-label="Workflow steps" className="hidden lg:flex w-56 shrink-0 flex-col py-10 pr-4">
      <ol className="relative ml-2 flex flex-col gap-0">
        {steps.map((s, i) => {
          const active = s.id === step
          const reachable = isReachable(s.id)
          const isLast = i === steps.length - 1
          return (
            <li key={s.id} className="relative flex gap-3 pb-9">
              {!isLast && (
                <span
                  className="absolute left-[7px] top-4 w-px rail-line"
                  style={{ height: 'calc(100% - 0.25rem)' }}
                />
              )}
              <span
                className={`relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                  active
                    ? 'border-teal bg-teal dark:border-amber dark:bg-amber'
                    : reachable
                      ? 'border-teal bg-paper dark:border-amber dark:bg-forest'
                      : 'border-border dark:border-border-dark bg-paper dark:bg-forest'
                }`}
              />
              <button
                disabled={!reachable}
                onClick={() => reachable && setStep(s.id)}
                className={`text-left text-[15px] leading-tight transition-colors disabled:cursor-not-allowed ${
                  active
                    ? 'font-semibold text-ink dark:text-mist'
                    : reachable
                      ? 'text-ink-soft hover:text-ink dark:text-mist-soft dark:hover:text-mist'
                      : 'text-ink-soft/40 dark:text-mist-soft/30'
                }`}
              >
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
