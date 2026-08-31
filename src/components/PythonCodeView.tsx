import { useMemo, useState } from 'react'
import type { TrainedModelResult } from '../types'
import { useApp } from '../context/AppContext'
import { generatePythonCode } from '../utils/pythonCodeGen'
import { Button, Card, Callout } from './ui'

export function PythonCodeView({ result }: { result: TrainedModelResult }) {
  const { dataset, settings } = useApp()
  const [copied, setCopied] = useState(false)

  const code = useMemo(() => {
    if (!dataset) return ''
    return generatePythonCode({
      datasetName: `${dataset.name}.csv`,
      featureColumns: result.featureColumns,
      targetColumn: result.targetColumn,
      taskType: result.taskType,
      modelId: result.modelId,
      hyperParams: result.hyperParams,
      testSize: settings.testSize,
      seed: settings.randomSeed,
      kFolds: result.hyperParams.kFolds,
    })
  }, [dataset, result, settings])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard may be unavailable; the code is still selectable and visible
    }
  }

  return (
    <div className="space-y-4">
      <Callout tone="teal">
        This is optional. You do not need programming knowledge to use DataForge ML. This code is provided for
        researchers who want to reproduce their analysis in Python.
      </Callout>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-4 py-2.5">
          <p className="text-sm font-medium text-ink dark:text-mist">Python (pandas + scikit-learn)</p>
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? 'Copied!' : 'Copy code'}
          </Button>
        </div>
        <pre className="max-h-[520px] overflow-auto p-4 text-xs leading-relaxed font-mono text-ink dark:text-mist">
          {code}
        </pre>
      </Card>
    </div>
  )
}
