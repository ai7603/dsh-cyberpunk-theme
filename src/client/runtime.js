/**
 * Permanent-install bridges for the theme core.
 *
 * Dynamic packages receive `styles.insert(css)` and `host.call(method, args)`
 * as evaluator closure parameters. A bundled client has no evaluator, so the
 * permanent entry installs these two small objects on
 * `globalThis.__DSH_CYBERPUNK_STYLES__` / `__DSH_CYBERPUNK_HOST__` before
 * invoking `cyberpunkClientPlugin().apply(ctx)`. `src/client.js` resolves the
 * shims lazily through module-scope wrappers.
 *
 * Styles are plugin-owned `<style data-plugin>` tags — the same ownership
 * marker the client module loader uses for HMR cleanup. The host bridge keeps
 * the decorative UPLINK heartbeat working without a dynamic `harness.handle`
 * half: a permanent plugin cannot register package-private dynamic RPC, so
 * `ping` reports browser connectivity instead of host connectivity.
 */

const PKG_ID = 'dsh-cyberpunk-theme'

/** True when the shim is not running inside a browser (node-side smoke tests). */
function browserScope() {
  return typeof document !== 'undefined' && typeof navigator !== 'undefined'
}

/**
 * Create the permanent equivalent of the dynamic `styles` symbol.
 * @returns a style bookkeeper with the `insert(css) => disposer` shape the
 *   theme core expects, plus a dispose-all used by the entry's cleanup.
 */
export function createPermanentStyles() {
  const tags = new Set()
  return {
    insert(css) {
      if (!browserScope()) return function () {}
      if (typeof css !== 'string') throw new Error('dsh-cyberpunk-theme: styles.insert(css) needs a CSS string')
      const tag = document.createElement('style')
      tag.dataset.plugin = PKG_ID
      tag.dataset.pluginCss = PKG_ID + '/style-' + tags.size
      tag.textContent = css
      document.head.append(tag)
      tags.add(tag)
      return function () {
        tags.delete(tag)
        tag.remove()
      }
    },
    dispose() {
      for (const tag of tags) tag.remove()
      tags.clear()
    },
  }
}

/**
 * Create the permanent equivalent of the dynamic `host` symbol.
 * @returns a host bridge; `ping` resolves while the browser reports online
 *   and rejects while offline, which is exactly the two-state signal the
 *   status strip renders (ONLINE / OFFLINE).
 */
export function createPermanentHost() {
  return {
    call(method, args) {
      void args
      if (method === 'ping') {
        const online = !browserScope() || navigator.onLine !== false
        if (!online) return Promise.reject(new Error('dsh-cyberpunk-theme: browser is offline'))
        return Promise.resolve({ ok: true, ts: Date.now(), bridge: 'browser' })
      }
      return Promise.reject(new Error('dsh-cyberpunk-theme: unknown host method ' + String(method)))
    },
  }
}
