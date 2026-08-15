/**
 * Permanent plugin entry (browser half).
 *
 * This is the module the DSH client loader materializes from
 * `/plugins/dsh-cyberpunk-theme/client.js`; it must export the standard
 * Cordis function-plugin face (`name` / `inject` / `apply`). It installs the
 * style + host bridges the shared theme core expects, then delegates to the
 * same `cyberpunkClientPlugin()` body the dynamic-plugin flow uses, so the
 * permanent install and the 30-second dynamic install render identically.
 */
import { cyberpunkClientPlugin } from '../client.js'
import { createPermanentHost, createPermanentStyles } from './runtime.js'

const PKG_ID = 'dsh-cyberpunk-theme'

/** Stable Cordis plugin name (the cordis.patch.yml entry id). */
export const name = 'cyberpunk-2077'

/**
 * Hard dependencies: slots + theme are mandatory for the reskin; timer is
 * always present in web compositions (provided by the cordis client runner)
 * and keeps the status-strip clock and heartbeat running.
 */
export const inject = ['slots', 'theme', 'timer']

/**
 * Mount the permanent plugin. Bridge installation is scoped to this fiber:
 * on stop/update the global shims are removed and any style tags are disposed.
 * @param ctx - browser plugin context.
 */
export function apply(ctx) {
  const styles = createPermanentStyles()
  const host = createPermanentHost()
  const scope = typeof globalThis === 'undefined' ? {} : globalThis

  scope.__DSH_CYBERPUNK_STYLES__ = styles
  scope.__DSH_CYBERPUNK_HOST__ = host

  ctx.effect(() => () => {
    if (scope.__DSH_CYBERPUNK_STYLES__ === styles) delete scope.__DSH_CYBERPUNK_STYLES__
    if (scope.__DSH_CYBERPUNK_HOST__ === host) delete scope.__DSH_CYBERPUNK_HOST__
    styles.dispose()
  }, `${PKG_ID}: permanent bridge cleanup`)

  return cyberpunkClientPlugin().apply(ctx)
}
