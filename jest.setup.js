import "@testing-library/jest-dom"
// Ensure the API test combined summary is printed when the test process exits
import '@/test-utils/jest-api-summary'
import * as rtl from '@testing-library/react'
import React from 'react'
import GameRulesProvider from '@/components/game/GameRulesProvider'

// Simple Next.js router mock for tests that call useRouter().push or read query
const mockRouter = {
	push: jest.fn(),
	replace: jest.fn(),
	prefetch: jest.fn().mockResolvedValue(undefined),
	pathname: '/',
	asPath: '/',
	query: {},
}

// Expose a helper to set router values in tests
global.__NEXT_ROUTER_MOCK = mockRouter

// Custom render that wraps components with global providers used by the app
function renderWithProviders(ui, options = {}) {
	return rtl.render(
		React.createElement(GameRulesProvider, null, ui),
		options,
	)
}

// Monkey-patch @testing-library/react's render to automatically include GameRulesProvider
try {
	const originalRender = rtl.render
		// Patch render to auto-wrap provider
		rtl.render = (ui, options) => originalRender(React.createElement(GameRulesProvider, null, ui), options)
} catch (err) {
	// ignore if patching fails
}

// Expose renderWithProviders globally so tests can call it if they prefer
global.renderWithProviders = renderWithProviders

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

// Note: we intentionally DO NOT call jest.mock('next/navigation') here so individual tests can mock the
// navigation module as needed. Tests that don't mock it can rely on `global.__NEXT_ROUTER_MOCK` as a fallback
// by mocking next/navigation themselves to return that object.
