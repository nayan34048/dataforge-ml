import { useApp } from '../context/AppContext'
import { SectionHeading } from './ui'

export function GoalSelection() {
  const { setGoal, setStep } = useApp()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      <SectionHeading eyebrow="Step 2 of 6" title="What would you like to do?" />

      <div className="grid gap-5 sm:grid-cols-2">
        <button
          onClick={() => {
            setGoal('predict')
            setStep('target')
          }}
          className="group flex flex-col items-start rounded-xl border border-border dark:border-border-dark p-6 text-left transition-colors hover:border-teal dark:hover:border-amber"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-soft text-teal-strong dark:bg-teal/20 dark:text-teal-soft">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-lg font-semibold text-ink dark:text-mist">Make a prediction</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-mist-soft">
            Predict a number or a category, like a price, a score, or whether something will happen.
          </p>
        </button>

        <button
          onClick={() => {
            setGoal('explore')
            setStep('target')
          }}
          className="group flex flex-col items-start rounded-xl border border-border dark:border-border-dark p-6 text-left transition-colors hover:border-teal dark:hover:border-amber"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-soft text-amber-strong dark:bg-amber/20 dark:text-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="7" cy="8" r="2.4" />
              <circle cx="17" cy="7" r="2.4" />
              <circle cx="16" cy="16" r="2.4" />
              <circle cx="7" cy="17" r="1.8" />
            </svg>
          </div>
          <p className="font-display text-lg font-semibold text-ink dark:text-mist">Explore patterns in my data</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-mist-soft">
            Discover natural groups or clusters in your data, without needing to specify a result column.
          </p>
        </button>
      </div>
    </div>
  )
}
