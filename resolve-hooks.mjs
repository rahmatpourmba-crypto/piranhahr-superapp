import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const ROOT = process.cwd()

export async function resolve(specifier, context, nextResolve) {
  let mapped = null
  if (specifier === 'schema') mapped = join(ROOT, 'schema.js')
  else if (specifier.startsWith('lib/')) mapped = join(ROOT, specifier.replace(/\.js$/, '') + '.js')
  else if (specifier.startsWith('handlers/')) mapped = join(ROOT, specifier.replace(/\.js$/, '') + '.js')
  if (mapped) {
    return { url: pathToFileURL(mapped).href, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}