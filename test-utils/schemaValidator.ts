import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import swaggerRaw from '../swagger.json'

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)

const swagger = (swaggerRaw as any).swaggerDoc || (swaggerRaw as any)

// Cache compiled validators: key is operationId or path|method
const validators = new Map<string, ValidateFunction>()


function schemaKey(path: string, method: string, operationId?: string) {
  return operationId ? `op:${operationId}` : `p:${method.toLowerCase()}:${path}`
}

export function getResponseValidator(path: string, method: string, status = 200) {
  try {
    // Attempt to find operation in swagger.paths
    const paths = swagger.paths || {}
    const p = paths[path] || Object.keys(paths).find(k => k.replace(/\{[^}]+\}/g, '{}') === path.replace(/\{[^}]+\}/g, '{}'))
    const op = p && paths[p] && paths[p][method.toLowerCase()]
    const operationId = op && op.operationId

    const key = schemaKey(path, method, operationId)
    if (validators.has(key)) return validators.get(key)

    // Find response schema under responses[status].content.application/json.schema
    const responses = op && op.responses
    if (!responses) return undefined
    const resp = responses[status] || responses['200'] || responses['default']
    const schema = resp && resp.content && resp.content['application/json'] && resp.content['application/json'].schema
    if (!schema) return undefined

    const validate = ajv.compile(schema)
    validators.set(key, validate)
    return validate
  } catch (e) {
    return undefined
  }
}

export function validateResponse(path: string, method: string, status: number, data: any) {
  const v = getResponseValidator(path, method, status)
  if (!v) return { ok: true }
  const valid = v(data)
  return { ok: !!valid, errors: v.errors }
}

export default { getResponseValidator, validateResponse }
