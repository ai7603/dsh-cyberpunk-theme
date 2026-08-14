/* Build README.md from README.template.md, injecting the exact copy-paste
   plugin bodies extracted from src/client.js and src/host.js, so the install
   section never drifts from the real code. */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function extractBody(file, label) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8')
  const marker = src.indexOf('\n  return {')
  if (marker < 0) throw new Error(`no "  return {" in ${file}`)
  let body = src.slice(marker + 1)
  const trimmed = body.trimEnd()
  if (!trimmed.endsWith('}')) throw new Error(`unexpected tail in ${file}`)
  body = trimmed.slice(0, -1).trimEnd()
  // balance check (skips strings/templates/comments)
  let depth = 0, i = 0, inStr = null
  while (i < body.length) {
    const ch = body[i], next = body[i + 1]
    if (inStr === 'tpl') { if (ch === '\\') { i += 2; continue } if (ch === '`') inStr = null; i++; continue }
    if (inStr) { if (ch === '\\') { i += 2; continue } if (ch === inStr) inStr = null; i++; continue }
    if (ch === '/' && next === '/') { while (i < body.length && body[i] !== '\n') i++; continue }
    if (ch === '/' && next === '*') { i += 2; while (i < body.length && !(body[i] === '*' && body[i + 1] === '/')) i++; i += 2; continue }
    if (ch === '`') { inStr = 'tpl'; i++; continue }
    if (ch === '"' || ch === "'") { inStr = ch; i++; continue }
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth < 0) throw new Error(`unbalanced in ${file}`)
    i++
  }
  if (depth !== 0) throw new Error(`${file}: brace mismatch ${depth}`)
  return body
}

const client = extractBody('src/client.js', 'client')
const host = extractBody('src/host.js', 'host')

const tpl = fs.readFileSync(path.join(ROOT, 'README.template.md'), 'utf8')
let out = tpl
  .split('{{CLIENT_BODY}}').join(client)
  .split('{{HOST_BODY}}').join(host)
if (out.includes('{{')) {
  const leftovers = out.match(/\{\{[A-Z_]+}}/g) || []
  throw new Error('unresolved placeholders: ' + leftovers.join(', '))
}
fs.writeFileSync(path.join(ROOT, 'README.md'), out)
console.log(`README.md generated (${client.length} chars client body, ${host.length} chars host body)`)
