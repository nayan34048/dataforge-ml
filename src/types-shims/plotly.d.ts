declare module 'plotly.js-dist-min' {
  const Plotly: any
  export default Plotly
}
declare module 'react-plotly.js/factory' {
  import { ComponentType } from 'react'
  const createPlotlyComponent: (plotly: any) => ComponentType<any>
  export default createPlotlyComponent
}
