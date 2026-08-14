/**
 * DeepSeek Harness — Cyberpunk 2077 Theme (host half)
 *
 * Host side of the package-private Client→Host RPC: it answers `ping` so the
 * client status strip can render a live UPLINK heartbeat (ONLINE / OFFLINE).
 *
 * This is the plain "function body" form accepted by the DSH dynamic-plugin
 * feature as `code.host`. In the web GUI, paste the `return { … }` block below
 * as the host code; the file also works as a plain ES module.
 */
export function cyberpunkHostPlugin() {
  return {
    apply(ctx) {
      ctx.effect(function () {
        return harness.handle('ping', function () {
          return { ok: true, ts: Date.now() }
        })
      })
    },
  }
}
