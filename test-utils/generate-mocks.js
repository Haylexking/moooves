const fs = require('fs')
const path = require('path')
const swagger = require('../../swagger.json')

function safeNameFromPath(p) {
  const normalized = p.replace(/^\/+/, '')
  return normalized.replace(/[^a-z0-9_]/gi, '_')
}

function exampleFromSchema(schema) {
  if (!schema) return { example: true }
  if (schema.example) return schema.example
  if (schema.type === 'array' && schema.items) return [exampleFromSchema(schema.items)]
  if (schema.type === 'object' && schema.properties) {
    const out = {}
    for (const [k, v] of Object.entries(schema.properties)) {
      out[k] = exampleFromSchema(v)
    }
    return out
  }
  if (schema.type === 'string') return schema.format === 'date-time' ? new Date().toISOString() : 'string'
  if (schema.type === 'integer' || schema.type === 'number') return 1
  if (schema.type === 'boolean') return true
  return null
}

const mocksDir = path.join(process.cwd(), 'lib', 'test-utils', 'mocks')
if (!fs.existsSync(mocksDir)) fs.mkdirSync(mocksDir, { recursive: true })

const paths = swagger.paths || {}
for (const [p, methods] of Object.entries(paths)) {
  for (const [method, op] of Object.entries(methods)) {
    try {
      const responses = (op && op.responses) || {}
      const resp = responses['200'] || responses['201'] || responses['default'] || Object.values(responses)[0]
      const schema = resp && resp.content && resp.content['application/json'] && resp.content['application/json'].schema
      const filename = safeNameFromPath(p) + '.json'
      const filePath = path.join(mocksDir, filename)
      if (fs.existsSync(filePath)) continue
      const example = schema ? exampleFromSchema(schema) : { message: 'auto-generated-mock', path: p, method }
      fs.writeFileSync(filePath, JSON.stringify(example, null, 2))
      console.log('Wrote mock', filePath)
    } catch (e) {
      console.warn('Failed to generate mock for', p, method)
    }
  }
}

console.log('Mock generation complete')
