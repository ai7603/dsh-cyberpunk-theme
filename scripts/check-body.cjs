/* Strict brace balance check that skips strings/template literals/comments,
   plus a real parse check of the extracted function body. */
const fs = require('fs')
const body = fs.readFileSync(__dirname + '/client-body.txt', 'utf8')

function balance(src) {
  let depth = 0
  let i = 0
  let inStr = null
  while (i < src.length) {
    const ch = src[i]
    const next = src[i + 1]
    if (inStr === 'template') {
      if (ch === '\\') { i += 2; continue }
      if (ch === '`') inStr = null
      i++
      continue
    }
    if (inStr === 'str') {
      if (ch === '\\') { i += 2; continue }
      if (ch === inStr) inStr = null
      i++
      continue
    }
    if (ch === '/' && next === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (ch === '/' && next === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
    if (ch === '`') { inStr = 'template'; i++; continue }
    if (ch === '"' || ch === "'") { inStr = ch; i++; continue }
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth < 0) { console.log('NEGATIVE at', i, src.slice(Math.max(0, i - 60), i + 60)); return depth }
    i++
  }
  return depth
}

const d = balance(body)
console.log('brace balance:', d === 0 ? 'OK' : 'MISMATCH ' + d)
if (d !== 0) process.exit(1)

try {
  const fn = new Function(body) // body = "return { ... }"
  const plugin = fn()
  console.log('parse OK; plugin keys:', Object.keys(plugin).join(', '))
} catch (e) {
  console.error('SYNTAX ERROR:', e.message)
  process.exit(1)
}
