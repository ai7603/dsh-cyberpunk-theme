/**
 * Permanent-plugin entry (browser half) — the standard `exports["./client"]`
 * default export discovered from the package.json `dsh.client` declaration.
 * The dynamic-plugin flow pastes the `return { … }` block from `src/client.js`
 * instead; this file only exists for permanent installs.
 */
import { cyberpunkClientPlugin } from './client.js'

export default cyberpunkClientPlugin()
