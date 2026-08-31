import { useApp } from '../context/AppContext'
import { Button } from './ui'

export function Header() {
  const { darkMode, toggleDarkMode, dataset, resetWorkflow } = useApp()

  return (
    <header className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2.5">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#1F6F5C" />
          <circle cx="10" cy="20" r="3" fill="#FAF9F5" />
          <circle cx="17" cy="12" r="3" fill="#E3A23C" />
          <circle cx="24" cy="18" r="3" fill="#FAF9F5" />
          <path d="M10 20 L17 12 L24 18" stroke="#FAF9F5" strokeWidth="1.5" fill="none" />
        </svg>
        <span className="font-display text-lg font-semibold text-ink dark:text-mist">DataForge ML</span>
      </div>
      <div className="flex items-center gap-3">
        {dataset && (
          <Button variant="ghost" size="sm" onClick={resetWorkflow}>
            Start over
          </Button>
        )}
        <button
          aria-label="Toggle dark mode"
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border dark:border-border-dark text-ink-soft dark:text-mist-soft hover:text-teal dark:hover:text-amber"
        >
          {darkMode ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
