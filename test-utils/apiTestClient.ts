import fs from 'fs'
import path from 'path'
import swaggerRaw from '../swagger.json'
import { TEST_MODE, BASE_URL } from './config'
import schemaValidator from './schemaValidator'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface ApiCallOptions {
  method?: HttpMethod
  path: string
  body?: any
  headers?: Record<string,string>
}

const swagger = (swaggerRaw as any).swaggerDoc || swaggerRaw

export const listPaths = () => Object.keys(swagger.paths || {})

export async function callApi({ method = 'get', path: p, body, headers = {} }: ApiCallOptions) {
  // If mock mode, attempt to load a mock response file under lib/test-utils/mocks
  if (TEST_MODE === 'mock') {
    const normalized = p.replace(/^\/+/, '')
    const safeName = normalized.replace(/[^a-z0-9_]/gi, '_')
    const mockPath = pathJoin('lib/test-utils/mocks', `${safeName}.json`)
    try {
      const raw = fs.readFileSync(mockPath, 'utf-8')
      const parsed = JSON.parse(raw)
      // Validate against swagger schema if available
      const validation = schemaValidator.validateResponse(p, method, 200, parsed)
      if (!validation.ok) {
        const err = new Error(`Schema validation failed for mock ${p} ${method}: ${JSON.stringify(validation.errors)}`)
        // Throwing will fail the Jest test where callApi is awaited
        throw err
      }
      return {
        status: 200,
        json: async () => parsed,
      }
    } catch (e) {
      // If read failed, return a 404 style object to let tests skip or mark pending
      if (e && (e as Error).message && (e as Error).message.startsWith('Schema validation failed')) throw e
      return {
        status: 404,
        json: async () => ({ error: 'mock-not-found', path: p }),
      }
    }
  }

  // Live mode: send HTTP request to BASE_URL
  const url = `${BASE_URL}${p}`
  // Lazy-require fetch so tests in mock mode don't need node-fetch installed
  let fetchImpl: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fetchImpl = require('node-fetch')
    // node-fetch exports the default function as default or the module itself depending on version
    fetchImpl = fetchImpl.default || fetchImpl
  } catch (err) {
    throw new Error('node-fetch is required for live TEST_MODE. Install it as a devDependency to run live integration tests.')
  }

  const res = await fetchImpl(url, {
    method: method.toUpperCase(),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Attempt to validate JSON body against swagger schema if possible
  let data: any = null
  try {
    data = await res.json()
  } catch (e) {
    // not JSON; return raw response
    return res
  }

  const validation = schemaValidator.validateResponse(p, method, res.status || 200, data)
  if (!validation.ok) {
    throw new Error(`Schema validation failed for ${p} ${method}: ${JSON.stringify(validation.errors)}`)
  }

  // mimic fetch Response for callers
  return {
    status: res.status,
    json: async () => data,
  }
}

function pathJoin(...parts: string[]) {
  return parts.map(p => p.replace(/^\/+|\/+$/g, '')).join(path.sep)
}
