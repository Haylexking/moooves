import "@testing-library/jest-dom"
// Ensure the API test combined summary is printed when the test process exits
import '@/test-utils/jest-api-summary'

// Provide a safe fetch polyfill for Jest environment when tests reference fetch/apiClient
if (typeof global !== 'undefined' && typeof global.fetch === 'undefined') {
	// Lightweight polyfill that returns 404 and a JSON body to avoid crashing tests.
	// Tests should mock `apiClient` where network behavior is required; this is a safe fallback.
	global.fetch = async (url, opts) => {
		// eslint-disable-next-line no-console
		console.warn('Using test fetch polyfill for', url)
		return {
			ok: false,
			status: 404,
			json: async () => ({ error: 'fetch-not-implemented', url }),
		}
	}
}
