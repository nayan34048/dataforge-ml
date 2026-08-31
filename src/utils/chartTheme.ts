export function baseLayout(darkMode: boolean, overrides: Record<string, unknown> = {}) {
  const ink = darkMode ? '#EAF3EF' : '#1B2B27'
  const inkSoft = darkMode ? '#A9BFB9' : '#4A5A55'
  const border = darkMode ? '#24413B' : '#E4E1D6'
  return {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, system-ui, sans-serif', color: ink, size: 12 },
    margin: { t: 30, r: 20, b: 40, l: 50 },
    xaxis: { gridcolor: border, zerolinecolor: border, color: inkSoft, ...(overrides.xaxis as object) },
    yaxis: { gridcolor: border, zerolinecolor: border, color: inkSoft, ...(overrides.yaxis as object) },
    legend: { font: { color: ink } },
    ...overrides,
  }
}

export const PALETTE = ['#1F6F5C', '#E3A23C', '#C1543C', '#4A5A55', '#2E8B73', '#A9BFB9', '#C9862A', '#175545']

export const plotConfig = { displayModeBar: false, responsive: true }
