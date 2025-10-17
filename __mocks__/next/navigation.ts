export function useRouter() {
  // Provide a safe router shape for tests that don't mock next/navigation
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => Promise.resolve(undefined),
    pathname: '/',
    asPath: '/',
    query: {},
  }
}

export function useSearchParams() {
  return new URLSearchParams()
}
