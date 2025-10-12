import globalReport from './globalReport'

type Result = 'passed' | 'tested' | 'pending'

interface EndpointRecord {
  endpoint: string
  result: Result
  status?: number
}

const modules: Record<string, EndpointRecord[]> = {}

export function createModule(name: string) {
  if (!modules[name]) modules[name] = []
}

export function record(moduleName: string, endpoint: string, result: Result, status?: number) {
  if (!modules[moduleName]) createModule(moduleName)
  modules[moduleName].push({ endpoint, result, status })
  // forward to global collector
  globalReport.addRecord(moduleName, endpoint, result, status)
}

export default { createModule, record }
