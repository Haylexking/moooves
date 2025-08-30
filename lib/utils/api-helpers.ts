// API Helper utilities
export function handleApiError(error: any): string {
  if (typeof error === "string") {
    return error
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return "An unexpected error occurred"
}

export function isNetworkError(error: any): boolean {
  return error?.code === "NETWORK_ERROR" || error?.message?.includes("fetch") || error?.message?.includes("Network")
}

export function shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) return false

  // Retry on network errors or 5xx server errors
  return isNetworkError(error) || (error?.status >= 500 && error?.status < 600)
}

// Request retry wrapper
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!shouldRetry(error, attempt, maxAttempts)) {
        throw error
      }

      // Wait before retrying
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError
}
