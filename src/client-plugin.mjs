/**
 * Historical convenience entry: exports the theme core as a default Cordis
 * plugin object. The real permanent install is `lib/client.js` (built from
 * `src/client/index.js` by tsdown); the dynamic-plugin flow pastes the
 * `return { … }` block from `src/client.js` instead. Kept for programmatic
 * importers that mount the object form manually.
 */
import { cyberpunkClientPlugin } from './client.js'

export default cyberpunkClientPlugin()
