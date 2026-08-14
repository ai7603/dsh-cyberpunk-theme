/**
 * Permanent-plugin entry (host half) — the standard Cordis default export the
 * Loader expects from a `cordis.yml` row (`name: dsh-cyberpunk-theme`).
 * The dynamic-plugin flow pastes the `return { … }` block from `src/host.js`
 * instead; this file only exists for permanent installs.
 */
import { cyberpunkHostPlugin } from './host.js'

export default cyberpunkHostPlugin()
