/**
 * Historical convenience entry: exports the dynamic host half (the ping RPC)
 * as a default Cordis plugin object. The real permanent host entry is
 * `lib/index.js` (no-op loader entry built from `src/host-index.js`); the
 * dynamic-plugin flow pastes the `return { … }` block from `src/host.js`
 * instead. Kept for programmatic importers.
 */
import { cyberpunkHostPlugin } from './host.js'

export default cyberpunkHostPlugin()
