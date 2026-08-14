/**
 * DeepSeek Harness — Cyberpunk 2077 Theme
 *
 * Public entry: re-exports the client and host halves of the plugin.
 * Each half is a factory returning a Cordis Plugin object in the exact
 * plain-JavaScript "function body" shape accepted by the DSH dynamic-plugin
 * feature (`code.client` / `code.host`).
 */
export { cyberpunkClientPlugin } from './src/client.js'
export { cyberpunkHostPlugin } from './src/host.js'
