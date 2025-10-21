export function getReturnPath(): string | null {
  try {
    const v = localStorage.getItem('return_to')
    return v || null
  } catch {
    return null
  }
}

export function clearReturnPath() {
  try {
    localStorage.removeItem('return_to')
  } catch {}
}

export function setReturnPath(path: string) {
  try {
    localStorage.setItem('return_to', path)
  } catch {}
}
