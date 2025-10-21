export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input as any, init)
  if (typeof window !== 'undefined' && res.status === 401) {
    try {
      const ret = `${window.location.pathname}${window.location.search}${window.location.hash}`
      localStorage.setItem('return_to', ret)
    } catch {}
    try {
      // Decide correct onboarding destination
      let mode = 'player'
      try {
        const stored = localStorage.getItem('onboarding_mode')
        if (stored === 'host' || stored === 'player') mode = stored
      } catch {}
      try {
        const p = window.location.pathname || ''
        if (/\bhost\b/i.test(p) || /\bhost\//i.test(p) || /\/tournaments/i.test(p)) {
          mode = mode === 'player' ? 'host' : mode
        }
      } catch {}
      const target = mode === 'host' ? '/onboarding/host' : '/onboarding'
      window.location.href = target
    } catch {}
  }
  return res
}
