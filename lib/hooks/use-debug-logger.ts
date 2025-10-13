export function logDebug(namespace: string, details?: Record<string, any>) {
  try {
    // Allow disabling debug logs explicitly with QUIET_LOGS=true
    if (typeof process !== 'undefined' && process.env) {
      const quiet = String(process.env.QUIET_LOGS).toLowerCase() === 'true'
      const nodeEnv = process.env.NODE_ENV
      if (quiet) return
      if (nodeEnv === 'production') return
      // Structured and namespaced debug output
      // Keep minimal to avoid circular imports
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${namespace}:`, details ?? {})
    }
  } catch (e) {
    // noop in non-Node environments
  }
}

export default logDebug
