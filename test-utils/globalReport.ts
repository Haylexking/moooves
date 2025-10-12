import fs from 'fs'
import path from 'path'

type Result = 'passed' | 'tested' | 'pending'

interface EndpointRecord {
  module: string
  endpoint: string
  result: Result
  status?: number
}

const records: EndpointRecord[] = []

export function addRecord(module: string, endpoint: string, result: Result, status?: number) {
  records.push({ module, endpoint, result, status })
}

export function printCombinedSummary() {
  const byModule: Record<string, EndpointRecord[]> = {}
  for (const r of records) {
    byModule[r.module] = byModule[r.module] || []
    byModule[r.module].push(r)
  }

  console.log('\n=== COMBINED API TEST SUMMARY ===')
  for (const [mod, recs] of Object.entries(byModule)) {
    const total = recs.length
    const passed = recs.filter(r => r.result === 'passed').length
    const pending = recs.filter(r => r.result === 'pending').length
    const tested = recs.filter(r => r.result === 'tested').length
    console.log(`${mod}: total=${total} passed=${passed} tested=${tested} pending=${pending}`)
  }
  console.log('=================================\n')
}

// Optionally persist summary to disk for CI parsing
export function persistSummary(file = 'test-api-summary.json') {
  const out = { modules: {} as Record<string, { total:number; passed:number; tested:number; pending:number }> }
  const byModule: Record<string, EndpointRecord[]> = {}
  for (const r of records) {
    byModule[r.module] = byModule[r.module] || []
    byModule[r.module].push(r)
  }
  for (const [mod, recs] of Object.entries(byModule)) {
    out.modules[mod] = { total: recs.length, passed: recs.filter(x => x.result === 'passed').length, tested: recs.filter(x => x.result === 'tested').length, pending: recs.filter(x => x.result === 'pending').length }
  }
  try {
    fs.writeFileSync(path.join(process.cwd(), file), JSON.stringify(out, null, 2))
  } catch (e) {
    // ignore write errors in some CI environments
  }
}

export default { addRecord, printCombinedSummary, persistSummary }
