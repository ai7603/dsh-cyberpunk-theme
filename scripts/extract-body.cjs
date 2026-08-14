/* Extract the plain function-body form of the client plugin from src/client.js:
   everything from "return {" to the matching final "}" (the plugin object). */
const fs = require('fs')
const src = fs.readFileSync(__dirname + '/../src/client.js', 'utf8')
const marker = src.indexOf('\n  return {')
if (marker < 0) throw new Error('no "  return {" found')
const body = src.slice(marker + 1)
// strip the trailing "}" that closes cyberpunkClientPlugin()
const trimmed = body.trimEnd()
if (!trimmed.endsWith('}')) throw new Error('unexpected tail')
const pluginObject = trimmed.slice(0, -1).trimEnd() // remove final closing brace
fs.writeFileSync(__dirname + '/client-body.txt', pluginObject + '\n')
console.log('extracted', pluginObject.length, 'chars -> scripts/client-body.txt')
// quick sanity: balanced braces
let depth = 0
for (const ch of pluginObject) {
  if (ch === '{') depth++
  else if (ch === '}') depth--
  if (depth < 0) throw new Error('unbalanced')
}
console.log('brace balance:', depth === 0 ? 'OK' : 'MISMATCH ' + depth)
