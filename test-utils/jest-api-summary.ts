import globalReport from './globalReport'

// Print combined summary on process exit or when Jest finishes
function printAndPersist() {
  try {
    globalReport.printCombinedSummary()
    globalReport.persistSummary()
  } catch (e) {
    // ignore
  }
}

if (typeof process !== 'undefined' && process && process.on) {
  process.on('exit', printAndPersist)
  process.on('SIGINT', () => { printAndPersist(); process.exit(130) })
}

export default { printAndPersist }
