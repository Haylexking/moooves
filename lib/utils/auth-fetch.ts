export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input as any, init)
  if (typeof window !== 'undefined' && (res.status === 401)) {
    try {
      const ret = `${window.location.pathname}${window.location.search}${window.location.hash}`
      localStorage.setItem('return_to', ret)
    } catch {}
    try {
      window.location.href = '/onboarding'
    } catch {}
  }
  return res
}
