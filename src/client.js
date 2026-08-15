/**
 * DeepSeek Harness — Cyberpunk 2077 Theme (client half)
 *
 * Reskins the whole DSH shell into a Night City look:
 *   - neon token palette (dark: blue-black + neon yellow/cyan/magenta;
 *     light: warm "Arasaka" paper + gold/red)
 *   - Night City wireframe grid, CRT scanlines, vignette, flowing frame
 *     ribbon, screen glitch
 *   - flowing + glitching brand wordmark
 *   - neon caret + neon focus glow on text inputs
 *   - a status strip under the composer (clock / date / UPLINK heartbeat /
 *     accent) with glitch flicker and a pulsing link dot
 *   - the shipped LLM stats line as per-group cut-corner chips with flowing
 *     gradient text
 *   - cyberpunk diagonal two-corner cuts (top-left + bottom-right) on user
 *     bubbles, tool-call group cards, composer card, New Session button and
 *     code blocks, with neon cut-edges
 *   - three performance tiers (Full / Balanced / Eco) to keep the Mac cool
 *   - a settings page (master on/off switch, color scheme, 4 accent presets,
 *     performance tiers, effect toggles)
 *
 * This is the plain "function body" form accepted by the DSH dynamic-plugin
 * feature as `code.client`. In the web GUI, paste the `return { … }` block
 * below as the client code; the file also works as a plain ES module.
 *
 * Permanent (bundled) install support: dynamic packages receive `React`,
 * `styles` and `host` as closure parameters from the evaluator. A bundled
 * client has no evaluator, so the permanent entry (`src/client/index.js`)
 * installs shims on `globalThis.__DSH_CYBERPUNK_*` before calling `apply()`.
 * The wrappers below resolve those shims lazily, while the dynamic-plugin
 * extraction scripts cut this file at the `return {` marker and therefore
 * keep using the evaluator parameters unchanged.
 */
import * as React from 'react'

const permanentScope = typeof globalThis === 'undefined' ? {} : globalThis

const styles = {
  insert(css) {
    const sink = permanentScope.__DSH_CYBERPUNK_STYLES__
    if (sink === undefined) {
      throw new Error('dsh-cyberpunk-theme: permanent style bridge is not installed (src/client/index.js must run first)')
    }
    return sink.insert(css)
  },
}

const host = {
  call(method, args) {
    const bridge = permanentScope.__DSH_CYBERPUNK_HOST__
    if (bridge === undefined) {
      return Promise.reject(new Error('dsh-cyberpunk-theme: permanent host bridge is not installed (src/client/index.js must run first)'))
    }
    return bridge.call(method, args)
  },
}

export function cyberpunkClientPlugin() {
  return {
    apply(ctx) {
      const theme = ctx.get('theme')
      const slots = ctx.get('slots')
      const timer = ctx.get('timer')
      if (theme === undefined || slots === undefined) return

      // ---------------- palette ----------------
      const baseTokens = {
        '--dsw-alias-bg-base': { light: '#edece2', dark: '#08090f' },
        '--dsw-alias-bg-layer-1': { light: '#f7f5ec', dark: '#0f111a' },
        '--dsw-alias-bg-layer-2': { light: '#e4e1d3', dark: '#151826' },
        '--dsw-alias-bg-overlay': { light: '#faf8f0', dark: '#12131d' },
        '--dsw-alias-border-l1': { light: '#d6d2c0', dark: '#1f2333' },
        '--dsw-alias-border-l2': { light: '#b9b49c', dark: '#2e3450' },
        '--dsw-alias-label-primary': { light: '#14140f', dark: '#e7f0f2' },
        '--dsw-alias-label-secondary': { light: '#57564a', dark: '#8794ab' },
        '--dsw-specific-sidebar-fill': { light: '#e6e3d6', dark: '#0a0c14' },
      }

      const ACCENTS = {
        yellow: {
          label: 'Night City — Yellow',
          brand: { light: '#b8860b', dark: '#fcee0a' },
          success: { light: '#008f8f', dark: '#00f0ff' },
          error: { light: '#d0003a', dark: '#ff2d55' },
          warn: { light: '#c77d00', dark: '#ffb000' },
        },
        cyan: {
          label: 'Netrunner — Cyan',
          brand: { light: '#007f9e', dark: '#00f0ff' },
          success: { light: '#008f6b', dark: '#00ff9f' },
          error: { light: '#d0003a', dark: '#ff2d55' },
          warn: { light: '#c77d00', dark: '#ffb000' },
        },
        magenta: {
          label: 'Trauma Team — Magenta',
          brand: { light: '#c2003a', dark: '#ff2d6b' },
          success: { light: '#008f8f', dark: '#00f0ff' },
          error: { light: '#a8002e', dark: '#ff1744' },
          warn: { light: '#c77d00', dark: '#ffb000' },
        },
        gold: {
          label: 'Arasaka — Gold',
          brand: { light: '#9a7b0a', dark: '#d4af37' },
          success: { light: '#008f6b', dark: '#00d0a0' },
          error: { light: '#a8002e', dark: '#ff3355' },
          warn: { light: '#b25f00', dark: '#ff8c00' },
        },
      }

      function tokensFor(key) {
        const a = ACCENTS[key]
        return Object.assign({}, baseTokens, {
          '--dsw-alias-brand-primary': a.brand,
          '--dsw-alias-state-success-primary': a.success,
          '--dsw-alias-state-error-primary': a.error,
          '--dsw-alias-state-warn-primary': a.warn,
        })
      }

      // ---------------- shared in-memory store ----------------
      const listeners = new Set()
      const state = { enabled: true, accent: 'yellow', perf: 'balanced', grid: true, scanlines: true, glitch: true, statusGlitch: true, version: 0 }

      function syncEnabledAttrs() {
        if (state.enabled) {
          document.documentElement.setAttribute('data-cp-enabled', '')
          document.documentElement.setAttribute('data-cp-perf', state.perf)
        } else {
          document.documentElement.removeAttribute('data-cp-enabled')
          document.documentElement.removeAttribute('data-cp-perf')
        }
      }

      function patch(p) {
        const accentChanged = p.accent !== undefined && p.accent !== state.accent
        const enabledChanged = p.enabled !== undefined && p.enabled !== state.enabled
        Object.assign(state, p)
        if (accentChanged || enabledChanged) syncTokens()
        if (p.enabled !== undefined || p.perf !== undefined) syncEnabledAttrs()
        state.version += 1
        listeners.forEach(function (fn) { try { fn() } catch (e) {} })
      }
      function subscribe(fn) {
        listeners.add(fn)
        return function () { listeners.delete(fn) }
      }

      // ---------------- theme token layer + scheme sync ----------------
      const SOURCE = 'cyberpunk-2077-theme'
      let disposeTokens = function () {}
      function syncTokens() {
        disposeTokens()
        disposeTokens = state.enabled ? theme.overrideTokens(SOURCE, tokensFor(state.accent)) : function () {}
      }
      syncTokens()
      syncEnabledAttrs()
      ctx.effect(function () {
        return function () {
          disposeTokens()
          document.documentElement.removeAttribute('data-cp-enabled')
          document.documentElement.removeAttribute('data-cp-perf')
        }
      })
      ctx.on('theme/change', function () { patch({}) })

      function applyAccent(key) {
        if (state.accent === key) return
        patch({ accent: key })
      }
      function setScheme(id) { theme.setTheme(id) }

      // ---------------- styles ----------------
      const FONT_CSS = "@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Chakra+Petch:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');"

      const MAIN_CSS = `
:root {
  --cp-font: 'Rajdhani', 'Chakra Petch', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --cp-mono: 'Share Tech Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --cp-glow: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);
}
html[data-cp-enabled],
html[data-cp-enabled] body { font-family: var(--cp-font) !important; }
html[data-cp-enabled] button { font-family: var(--cp-font) !important; }
html[data-cp-enabled] code,
html[data-cp-enabled] pre,
html[data-cp-enabled] kbd,
html[data-cp-enabled] samp { font-family: var(--cp-mono) !important; }
html[data-cp-enabled] ::selection { background: var(--dsw-alias-brand-primary); color: #08090f; }
html[data-cp-enabled] :focus-visible { outline: 1px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
html[data-cp-enabled] ::-webkit-scrollbar { width: 10px; height: 10px; }
html[data-cp-enabled] ::-webkit-scrollbar-track { background: transparent; }
html[data-cp-enabled] ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, #0b0c14), color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, #0b0c14));
  border: 2px solid var(--dsw-alias-bg-base);
  border-radius: 6px;
}

/* HUD typography + terminal touches */
html[data-cp-enabled] h1,
html[data-cp-enabled] h2,
html[data-cp-enabled] h3,
html[data-cp-enabled] h4 { letter-spacing: 0.06em; }
html[data-cp-enabled] pre { border-left: 2px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent); }
html[data-cp-enabled] input,
html[data-cp-enabled] textarea { caret-color: var(--dsw-alias-brand-primary); }
html[data-cp-enabled] input:not([type='checkbox']):not([type='radio']):focus,
html[data-cp-enabled] textarea:focus,
html[data-cp-enabled] select:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary) !important;
  box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary), 0 0 12px var(--cp-glow);
}

/* user message bubble → cyberpunk diagonal two-corner cut (top-left + bottom-right),
   with a neon cut-edge: the 1px border is clipped along the diagonal, so the cut
   line itself glows */
html[data-cp-enabled] [data-chat-flow-kind='user'] [data-time-hover-root] > div:first-child > div:last-child {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, var(--dsw-alias-bg-layer-1));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, transparent);
  border-radius: 0;
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent));
}

/* tool call groups → a REAL cut-corner card (the underlying rows are chrome-free,
   so the group seat becomes the visible cyberpunk card) */
html[data-cp-enabled] [data-chat-flow-kind='tool-call'] {
  margin: 2px 0 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-1));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 25%, transparent);
  border-radius: 0;
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent));
}

/* code blocks inside the conversation → two-corner cut too */
html[data-cp-enabled] [data-chat-flow-kind] pre {
  border-radius: 0;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

/* sidebar workspace/session rows → cyberpunk: neon rail, tint, accent text */
html[data-cp-enabled] [role='treeitem'] {
  position: relative;
  letter-spacing: 0.02em;
  transition: background 120ms ease, color 120ms ease;
}
html[data-cp-enabled] [role='treeitem']:hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent);
  color: var(--dsw-alias-brand-primary);
}
html[data-cp-enabled] [role='treeitem']:hover::before,
html[data-cp-enabled] [role='treeitem'][aria-selected='true']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 2px;
  background: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 8px var(--cp-glow);
  z-index: 1;
}
html[data-cp-enabled] [role='treeitem'][aria-selected='true'] {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);
  color: var(--dsw-alias-brand-primary);
}

/* real New Session button → cut-corner rectangle.
   NB: the brand wordmark button sits above it and is 100% filled by the
   wordmark svg — clipping THAT button would cut the brand, so it is left
   untouched (its wordmark keeps only the flowing color + glitch). The New
   Session button is the sidebar root's direct button child carrying the
   14×14 plus icon. */
html[data-cp-enabled] [data-slot="sidebar"] > div > button:has(> svg[viewBox="0 0 16 16"][width="14"]) {
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  border-radius: 0;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
html[data-cp-enabled] [data-slot="sidebar"] > div > button:has(> svg[viewBox="0 0 16 16"][width="14"]):hover {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, transparent);
}

/* composer card → cut-corner neon frame, drawn on a ::before layer.
   CRITICAL: never clip-path the card itself — the model selector and
   reasoning-effort menu render INSIDE the card (conversation.input.overlay
   anchor), and a clip-path on an ancestor hard-clips its descendants (they
   cannot escape, not even with position: fixed). The pseudo-element carries
   the cut shape instead: it paints the card fill + neon border + glow and is
   clipped alone, so the menus stay fully visible and clickable. */
html[data-cp-enabled] [data-composer-card] {
  position: relative;
  z-index: 0; /* stacking context so the ::before layer stays under the content */
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
html[data-cp-enabled] [data-composer-card]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--dsw-specific-input-major);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);
  border-radius: 0;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
  filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent));
}

/* brand wordmark + whale logo → flowing palette + glitch flicker */
html[data-cp-enabled] svg[viewBox="0 0 182 24"],
html[data-cp-enabled] svg[viewBox="0 0 23.16 17.04"] {
  animation: cp-brand 8s linear infinite, cp-brand-glitch 5s steps(1) infinite;
}
@keyframes cp-brand {
  0% { color: #fcee0a; }
  25% { color: #00f0ff; }
  50% { color: #ff2d6b; }
  75% { color: #b026ff; }
  100% { color: #fcee0a; }
}
@keyframes cp-brand-glitch {
  0%, 85%, 100% { transform: none; filter: none; opacity: 1; }
  86% { transform: translateX(-2px) skewX(-8deg); opacity: 0.8; filter: drop-shadow(2px 0 0 rgba(255,45,85,0.85)) drop-shadow(-2px 0 0 rgba(0,240,255,0.85)); }
  89% { transform: translateX(2px) skewX(6deg); opacity: 1; filter: drop-shadow(-2px 0 0 rgba(255,45,85,0.85)) drop-shadow(2px 0 0 rgba(0,240,255,0.85)); }
  93% { transform: translateX(-1px); opacity: 0.85; filter: drop-shadow(3px 0 0 rgba(255,45,85,0.7)) drop-shadow(-3px 0 0 rgba(0,240,255,0.7)); }
  97% { transform: none; filter: none; opacity: 1; }
}

/* ambient overlay */
html[data-cp-enabled] .cp-overlay { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
html[data-cp-enabled][data-cp-perf='full'] .cp-overlay { transform: translateZ(0); backface-visibility: hidden; }
html[data-cp-enabled] .cp-layer { position: absolute; inset: 0; }
html[data-cp-enabled] .cp-grid {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 25%, transparent 72%);
  mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 25%, transparent 72%);
}
html[data-cp-enabled] .cp-scanlines { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px); }
html[data-cp-enabled] [data-ds-dark-theme] .cp-scanlines { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px); }
html[data-cp-enabled] .cp-vignette { background: radial-gradient(ellipse at center, transparent 50%, rgba(4,5,10,0.5) 100%); }
/* Flowing neon frame, implemented as four THIN EDGE STRIPS instead of one
   full-screen gradient. Only the small inner strips move, and they animate
   transform (compositor-only), never background-position (which would
   force a full-size repaint every frame). The gradient tile is exactly one
   edge length, so translating the 2x strip by -50% loops seamlessly. */
html[data-cp-enabled] .cp-ribbon { position: absolute; inset: 0; pointer-events: none; opacity: 0.85; }
html[data-cp-enabled] .cp-ribbon-edge { position: absolute; overflow: hidden; }
html[data-cp-enabled] .cp-ribbon-edge--top { top: 2px; left: 2px; right: 2px; height: 2px; }
html[data-cp-enabled] .cp-ribbon-edge--right { right: 2px; top: 2px; bottom: 2px; width: 2px; }
html[data-cp-enabled] .cp-ribbon-edge--bottom { bottom: 2px; left: 2px; right: 2px; height: 2px; }
html[data-cp-enabled] .cp-ribbon-edge--left { left: 2px; top: 2px; bottom: 2px; width: 2px; }
html[data-cp-enabled] .cp-ribbon-flow { position: absolute; will-change: transform; }
html[data-cp-enabled] .cp-ribbon-edge--top .cp-ribbon-flow,
html[data-cp-enabled] .cp-ribbon-edge--bottom .cp-ribbon-flow {
  top: 0; bottom: 0; left: 0; width: 200%;
  background: linear-gradient(90deg, #fcee0a 0%, #00f0ff 25%, #ff2d6b 50%, #b026ff 75%, #fcee0a 100%);
  background-size: 50% 100%;
  animation: cp-ribbon-flow-x 7s linear infinite;
}
html[data-cp-enabled] .cp-ribbon-edge--right .cp-ribbon-flow,
html[data-cp-enabled] .cp-ribbon-edge--left .cp-ribbon-flow {
  left: 0; right: 0; top: 0; height: 200%;
  background: linear-gradient(180deg, #fcee0a 0%, #00f0ff 25%, #ff2d6b 50%, #b026ff 75%, #fcee0a 100%);
  background-size: 100% 50%;
  animation: cp-ribbon-flow-y 7s linear infinite;
}
html[data-cp-enabled][data-cp-perf='full'] .cp-ribbon-edge { box-shadow: 0 0 8px rgba(0,240,255,0.35); }
@keyframes cp-ribbon-flow-x {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes cp-ribbon-flow-y {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
html[data-cp-enabled] .cp-glitch {
  opacity: 0;
  background: linear-gradient(180deg,
    transparent 0%, transparent 18%,
    color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent) 18.2%,
    transparent 18.8%,
    transparent 42%,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent) 42.2%,
    transparent 42.8%,
    transparent 66%,
    color-mix(in srgb, #ff2d6b 12%, transparent) 66.2%,
    transparent 66.8%,
    transparent 100%);
  animation: cp-glitch 6s steps(1) infinite;
}
@keyframes cp-glitch {
  0%, 100% { opacity: 0; transform: translateX(0); }
  1% { opacity: 0.8; transform: translateX(-6px) skewX(-8deg); }
  3% { opacity: 0; }
  4% { opacity: 0.6; transform: translateX(5px); }
  6% { opacity: 0; transform: translateX(0); }
  27% { opacity: 0; }
  28% { opacity: 0.7; transform: translateX(4px) skewX(7deg); }
  30% { opacity: 0; }
  31% { opacity: 0.55; transform: translateX(-4px); }
  33% { opacity: 0; transform: translateX(0); }
  53% { opacity: 0; }
  54% { opacity: 0.7; transform: translateX(-5px) skewX(-7deg); }
  56% { opacity: 0; }
  57% { opacity: 0.55; transform: translateX(5px); }
  59% { opacity: 0; transform: translateX(0); }
  79% { opacity: 0; }
  80% { opacity: 0.65; transform: translateX(4px) skewX(8deg); }
  82% { opacity: 0; }
  83% { opacity: 0.5; transform: translateX(-4px); }
  85% { opacity: 0; transform: translateX(0); }
}

/* shipped LLM stats line → compact one-line chips, color synced with the brand (same keyframes) */
html[data-cp-enabled] div:has(+ .cp-status) > span:not([aria-hidden]) {
  display: inline-flex;
  align-items: center;
  margin: 0 2px;
  padding: 1px 6px;
  font-size: 11px;
  border: 1px solid color-mix(in srgb, #00f0ff 20%, transparent);
  color: #fcee0a;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
  animation: cp-brand 8s linear infinite, cp-stats-glitch 8s steps(1) infinite;
}
html[data-cp-enabled] div:has(+ .cp-status) > span[aria-hidden] { display: none; }
@keyframes cp-stats-glitch {
  0%, 88%, 100% { transform: none; filter: drop-shadow(0 0 6px rgba(0,240,255,0.35)); opacity: 1; }
  89% { transform: translateX(-1px); opacity: 0.85; filter: drop-shadow(1px 0 0 rgba(255,45,85,0.6)) drop-shadow(-1px 0 0 rgba(0,240,255,0.6)); }
  93% { transform: translateX(1px); opacity: 1; filter: drop-shadow(-1px 0 0 rgba(255,45,85,0.6)) drop-shadow(1px 0 0 rgba(0,240,255,0.6)); }
  96% { transform: translateX(-1px); opacity: 0.85; filter: drop-shadow(2px 0 0 rgba(255,45,85,0.55)) drop-shadow(-2px 0 0 rgba(0,240,255,0.55)); }
  98% { transform: none; filter: drop-shadow(0 0 6px rgba(0,240,255,0.35)); opacity: 1; }
}

/* status strip under the composer stats line */
html[data-cp-enabled] .cp-status {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  font-family: var(--cp-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary);
}
html[data-cp-enabled] .cp-status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
html[data-cp-enabled] .cp-status-time { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); }
html[data-cp-enabled] .cp-status-net { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); }
html[data-cp-enabled] .cp-status-net[data-net='offline'] { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); }
html[data-cp-enabled] .cp-status-net[data-net='sync'] { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
html[data-cp-enabled] .cp-status-dot { animation: cp-dot 2s ease-in-out infinite; }
html[data-cp-enabled] .cp-status-net[data-net='offline'] .cp-status-dot,
html[data-cp-enabled] .cp-status-net[data-net='sync'] .cp-status-dot { animation: none; }
@keyframes cp-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
html[data-cp-enabled] .cp-status--glitch .cp-status-chip { animation: cp-status-glitch 5s steps(1) infinite; }
html[data-cp-enabled] .cp-status--glitch .cp-status-chip:nth-child(2) { animation-delay: -1.2s; }
html[data-cp-enabled] .cp-status--glitch .cp-status-chip:nth-child(3) { animation-delay: -2.4s; }
html[data-cp-enabled] .cp-status--glitch .cp-status-chip:nth-child(4) { animation-delay: -3.6s; }
@keyframes cp-status-glitch {
  0%, 84%, 100% { transform: none; text-shadow: none; opacity: 1; }
  85% { transform: translateX(-2px) skewX(-4deg); text-shadow: 2px 0 #ff2d55, -2px 0 #00f0ff; }
  89% { transform: translateX(2px); text-shadow: -2px 0 #ff2d55, 2px 0 #00f0ff; }
  93% { transform: translateX(-1px); opacity: 0.7; text-shadow: 2px 0 #ff2d55, -2px 0 #00f0ff; }
  97% { transform: none; text-shadow: none; opacity: 1; }
}

/* settings page */
.cp-settings { padding: 6px 4px; max-width: 680px; color: var(--dsw-alias-label-primary); }
.cp-settings-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.cp-settings-sub { margin: 0 0 20px; font-size: 13px; color: var(--dsw-alias-label-secondary); letter-spacing: 0.02em; }
.cp-group { margin-bottom: 22px; }
.cp-group-label { margin-bottom: 8px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.cp-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.cp-note { font-size: 12px; letter-spacing: 0.04em; color: var(--dsw-alias-label-secondary); }
.cp-note strong { color: var(--dsw-alias-label-primary); }
.cp-btn {
  appearance: none; cursor: pointer; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font-family: var(--cp-font); font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 9px 14px;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: filter 120ms ease, border-color 120ms ease, background 120ms ease, color 120ms ease;
}
.cp-btn:hover { border-color: var(--dsw-alias-brand-primary); filter: drop-shadow(0 0 6px var(--cp-glow)); }
.cp-btn--active { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #08090f; filter: drop-shadow(0 0 8px var(--cp-glow)); }
.cp-btn--dark {
  background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #08090f;
  filter: drop-shadow(0 0 8px var(--cp-glow));
}
.cp-toggle { display: flex; align-items: center; gap: 10px; padding: 10px 0; cursor: pointer; font-size: 14px; letter-spacing: 0.04em; }
.cp-toggle input { width: 16px; height: 16px; accent-color: var(--dsw-alias-brand-primary); cursor: pointer; }
.cp-group--off { opacity: 0.5; }
.cp-btn:disabled { cursor: not-allowed; opacity: 0.45; filter: none; }
.cp-toggle input:disabled { cursor: not-allowed; opacity: 0.45; }
.cp-toggle--master { padding: 12px 0; font-size: 15px; }
.cp-toggle--master span { font-weight: 700; letter-spacing: 0.08em; }

/* performance tiers.
   full: every ambient layer + all motion, promoted to its own compositor
   layer so the animated ribbon/glitch do not repaint the app underneath.
   balanced (default): transform-only edge ribbon (slowed + stepped), static
   grid/scanlines/vignette, no decorative filters; brand/stats/status keep
   only their tiny intermittent glitch flashes (no continuous color flow).
   eco: no static atmosphere, no decorative drop-shadows or transitions;
   keeps the screen glitch + brand/stats/status glitch flashes. */
html[data-cp-enabled][data-cp-perf='balanced'] .cp-ribbon { opacity: 0.55; }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-ribbon-flow { animation-duration: 30s; animation-timing-function: steps(90, end); }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-grid { background-size: 64px 64px; }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-scanlines { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 6px); }
html[data-cp-enabled][data-cp-perf='balanced'] [data-ds-dark-theme] .cp-scanlines { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 6px); }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-vignette { background: radial-gradient(ellipse at center, transparent 58%, rgba(4,5,10,0.35) 100%); }
html[data-cp-enabled][data-cp-perf='balanced'] svg[viewBox="0 0 182 24"],
html[data-cp-enabled][data-cp-perf='balanced'] svg[viewBox="0 0 23.16 17.04"] { animation: cp-brand-glitch 5s steps(1) infinite; color: var(--dsw-alias-brand-primary); }
html[data-cp-enabled][data-cp-perf='balanced'] div:has(+ .cp-status) > span:not([aria-hidden]) { animation: cp-stats-glitch 8s steps(1) infinite; color: var(--dsw-alias-brand-primary); }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-status--glitch .cp-status-chip { animation: cp-status-glitch 5s steps(1) infinite; }
html[data-cp-enabled][data-cp-perf='balanced'] .cp-status-dot { animation: none !important; }
html[data-cp-enabled][data-cp-perf='balanced'] [data-chat-flow-kind='user'] [data-time-hover-root] > div:first-child > div:last-child { filter: none; }
html[data-cp-enabled][data-cp-perf='balanced'] [data-chat-flow-kind='tool-call'] { filter: none; }
html[data-cp-enabled][data-cp-perf='balanced'] [data-composer-card]::before { filter: none; }

html[data-cp-enabled][data-cp-perf='eco'] .cp-ribbon,
html[data-cp-enabled][data-cp-perf='eco'] .cp-grid,
html[data-cp-enabled][data-cp-perf='eco'] .cp-scanlines,
html[data-cp-enabled][data-cp-perf='eco'] .cp-vignette { display: none !important; }
html[data-cp-enabled][data-cp-perf='eco'] svg[viewBox="0 0 182 24"],
html[data-cp-enabled][data-cp-perf='eco'] svg[viewBox="0 0 23.16 17.04"] { animation: cp-brand-glitch 5s steps(1) infinite; color: var(--dsw-alias-brand-primary); }
html[data-cp-enabled][data-cp-perf='eco'] div:has(+ .cp-status) > span:not([aria-hidden]) { animation: cp-stats-glitch 8s steps(1) infinite; color: var(--dsw-alias-brand-primary) !important; }
html[data-cp-enabled][data-cp-perf='eco'] .cp-status--glitch .cp-status-chip { animation: cp-status-glitch 5s steps(1) infinite; }
html[data-cp-enabled][data-cp-perf='eco'] .cp-status-dot { animation: none !important; }
html[data-cp-enabled][data-cp-perf='eco'] [data-chat-flow-kind='user'] [data-time-hover-root] > div:first-child > div:last-child,
html[data-cp-enabled][data-cp-perf='eco'] [data-chat-flow-kind='tool-call'],
html[data-cp-enabled][data-cp-perf='eco'] [data-composer-card]::before { filter: none; box-shadow: none; }
html[data-cp-enabled][data-cp-perf='eco'] .cp-btn { transition: none; }
html[data-cp-enabled][data-cp-perf='eco'] .cp-btn--active,
html[data-cp-enabled][data-cp-perf='eco'] .cp-btn--dark { filter: none; }
html[data-cp-enabled][data-cp-perf='eco'] [role='treeitem'],
html[data-cp-enabled][data-cp-perf='eco'] [data-slot="sidebar"] > div > button:has(> svg[viewBox="0 0 16 16"][width="14"]) { transition: none; }
@media (prefers-reduced-motion: reduce) {
  html[data-cp-enabled] svg[viewBox="0 0 182 24"],
  html[data-cp-enabled] svg[viewBox="0 0 23.16 17.04"] { animation: none !important; color: var(--dsw-alias-brand-primary) !important; }
  html[data-cp-enabled] div:has(+ .cp-status) > span:not([aria-hidden]) { animation: none !important; color: var(--dsw-alias-brand-primary) !important; }
  html[data-cp-enabled] [data-slot="sidebar"] > div > button:has(> svg[viewBox="0 0 16 16"][width="14"]) { transition: none; }
  html[data-cp-enabled] .cp-glitch { animation: none !important; opacity: 0 !important; }
  html[data-cp-enabled] .cp-ribbon-flow { animation: none !important; }
  html[data-cp-enabled] .cp-status--glitch .cp-status-chip { animation: none !important; }
  html[data-cp-enabled] .cp-status-dot { animation: none !important; }
  html[data-cp-enabled] [role='treeitem'] { transition: none; }
  .cp-btn { transition: none; }
}
`

      const disposeFonts = styles.insert(FONT_CSS)
      const disposeMain = styles.insert(MAIN_CSS)
      ctx.effect(function () { return function () { disposeFonts(); disposeMain() } })

      // ---------------- components ----------------
      function useStore() {
        const [v, setV] = React.useState(state.version)
        React.useEffect(function () { return subscribe(function () { setV(state.version) }) }, [])
        return state
      }

      function CyberOverlay() {
        const st = useStore()
        // The neon frame is drawn as FOUR THIN EDGE STRIPS, not one
        // full-screen gradient. Each strip animates only `transform` on a
        // small compositor layer, so even Full/Balanced never rasterize the
        // whole viewport per frame. The full-screen glitch layer is cheap
        // too: it only animates opacity/transform for 4 brief double-flashes
        // per 6s cycle, so it is available in every tier (Eco mounts it alone).
        if (!st.enabled) return null
        if (st.perf === 'eco') {
          if (!st.glitch) return null
          return React.createElement('div', { className: 'cp-overlay', 'aria-hidden': 'true' },
            React.createElement('div', { className: 'cp-layer cp-glitch' }),
          )
        }
        const children = []
        if (st.grid) children.push(React.createElement('div', { key: 'grid', className: 'cp-layer cp-grid' }))
        if (st.scanlines) children.push(React.createElement('div', { key: 'scan', className: 'cp-layer cp-scanlines' }))
        children.push(React.createElement('div', { key: 'vig', className: 'cp-layer cp-vignette' }))
        if (st.glitch) children.push(React.createElement('div', { key: 'glitch', className: 'cp-layer cp-glitch' }))
        if (st.perf === 'full' || st.perf === 'balanced') {
          const edges = ['top', 'right', 'bottom', 'left'].map(function (side) {
            return React.createElement('span', { key: side, className: 'cp-ribbon-edge cp-ribbon-edge--' + side },
              React.createElement('span', { className: 'cp-ribbon-flow' }),
            )
          })
          children.push(React.createElement('div', { key: 'ribbon', className: 'cp-ribbon' }, edges))
        }
        return React.createElement('div', { className: 'cp-overlay', 'aria-hidden': 'true' }, children)
      }

      function pad2(n) { return n < 10 ? '0' + n : String(n) }
      function timeStr(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) }
      function dateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }

      function StatusStrip() {
        const st = useStore()
        const [now, setNow] = React.useState(function () { return new Date() })
        const [net, setNet] = React.useState('sync')
        React.useEffect(function () {
          if (!st.enabled) return undefined
          let stopClock
          let stopPing
          if (timer !== undefined) stopClock = timer.interval(function () { setNow(new Date()) }, 1000)
          function ping() {
            try {
              host.call('ping', {}).then(
                function () { setNet('online') },
                function () { setNet('offline') },
              )
            } catch (e) { setNet('offline') }
          }
          ping()
          if (timer !== undefined) stopPing = timer.interval(ping, 5000)
          return function () {
            if (stopClock) stopClock()
            if (stopPing) stopPing()
          }
        }, [st.enabled])
        if (!st.enabled) return null
        const netText = net === 'online' ? 'ONLINE' : (net === 'offline' ? 'OFFLINE' : 'SYNC')
        return React.createElement('div', { className: 'cp-status' + (st.statusGlitch ? ' cp-status--glitch' : '') },
          React.createElement('span', { className: 'cp-status-chip cp-status-time' }, 'Local ', timeStr(now)),
          React.createElement('span', { className: 'cp-status-chip' }, dateStr(now)),
          React.createElement('span', { className: 'cp-status-chip cp-status-net', 'data-net': net },
            'Uplink ',
            React.createElement('span', { className: 'cp-status-dot', 'aria-hidden': 'true' }, '●'),
            ' ', netText,
          ),
          React.createElement('span', { className: 'cp-status-chip' }, 'Accent ', st.accent.toUpperCase()),
        )
      }

      function schemeLabel() {
        const t = theme.getTheme()
        const resolved = t.active.colorScheme
        if (t.preference === 'system') return resolved === 'dark' ? 'System · Dark' : 'System · Light'
        return resolved === 'dark' ? 'Dark' : 'Light'
      }

      function CyberSettings() {
        const st = useStore()
        const activeScheme = theme.getTheme().active.colorScheme
        const optGroupClass = 'cp-group' + (st.enabled ? '' : ' cp-group--off')
        const ambientDisabled = !st.enabled || st.perf === 'eco'
        const statusGlitchDisabled = !st.enabled
        const accentBtns = Object.keys(ACCENTS).map(function (key) {
          return React.createElement('button', {
            key: key,
            type: 'button',
            className: 'cp-btn' + (st.accent === key ? ' cp-btn--active' : ''),
            disabled: !st.enabled,
            onClick: function () { applyAccent(key) },
          }, ACCENTS[key].label)
        })
        const perfBtns = ['full', 'balanced', 'eco'].map(function (id) {
          const label = id === 'full' ? 'Full' : (id === 'balanced' ? 'Balanced' : 'Eco')
          return React.createElement('button', {
            key: id,
            type: 'button',
            className: 'cp-btn' + (st.perf === id ? ' cp-btn--active' : ''),
            disabled: !st.enabled,
            onClick: function () { patch({ perf: id }) },
          }, label)
        })
        const schemeBtns = ['dark', 'system', 'light'].map(function (id) {
          const isActive = theme.getTheme().preference === id
          const label = id === 'dark' ? 'Night City (Dark)' : (id === 'system' ? 'System' : 'Light')
          return React.createElement('button', {
            key: id,
            type: 'button',
            className: 'cp-btn' + (isActive ? ' cp-btn--active' : '') + (id === 'dark' ? ' cp-btn--dark' : ''),
            disabled: !st.enabled,
            onClick: function () { setScheme(id) },
          }, label)
        })
        return React.createElement('div', { className: 'cp-settings' },
          React.createElement('h2', { className: 'cp-settings-title' }, 'Cyberpunk 2077'),
          React.createElement('p', { className: 'cp-settings-sub' }, 'Night City reskin for the DSH shell. Dark mode shows the full neon look.'),
          React.createElement('div', { className: 'cp-group' },
            React.createElement('div', { className: 'cp-group-label' }, 'Master switch'),
            React.createElement('label', { className: 'cp-toggle cp-toggle--master' },
              React.createElement('input', { type: 'checkbox', checked: st.enabled, onChange: function (e) { patch({ enabled: e.target.checked }) } }),
              React.createElement('span', null, 'Enable Cyberpunk theme'),
            ),
            React.createElement('p', { className: 'cp-note' },
              st.enabled
                ? 'Theme active. Turn it off to restore the native DSH look; this page stays available.'
                : 'Theme off — native DSH look restored. Turn it on to reapply the reskin.',
            ),
          ),
          React.createElement('div', { className: optGroupClass },
            React.createElement('div', { className: 'cp-group-label' }, 'Color scheme'),
            React.createElement('div', { className: 'cp-row' }, schemeBtns),
            React.createElement('p', { className: 'cp-note' }, 'Current: ', React.createElement('strong', null, schemeLabel()), ' (', activeScheme === 'dark' ? 'dark palette active' : 'light palette active', ')'),
          ),
          React.createElement('div', { className: optGroupClass },
            React.createElement('div', { className: 'cp-group-label' }, 'Accent'),
            React.createElement('div', { className: 'cp-row' }, accentBtns),
          ),
          React.createElement('div', { className: optGroupClass },
            React.createElement('div', { className: 'cp-group-label' }, 'Performance'),
            React.createElement('div', { className: 'cp-row' }, perfBtns),
            React.createElement('p', { className: 'cp-note' }, 'Full: all ambient motion + glitch. Balanced (default): slow stepped edge flow + static atmosphere + glitch flashes, cool. Eco: glitch flashes only, no static atmosphere or filters — coolest.'),
          ),
          React.createElement('div', { className: optGroupClass },
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.grid, disabled: ambientDisabled, onChange: function (e) { patch({ grid: e.target.checked }) } }),
              React.createElement('span', null, 'Grid'),
            ),
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.scanlines, disabled: ambientDisabled, onChange: function (e) { patch({ scanlines: e.target.checked }) } }),
              React.createElement('span', null, 'Scanlines'),
            ),
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.glitch, disabled: !st.enabled, onChange: function (e) { patch({ glitch: e.target.checked }) } }),
              React.createElement('span', null, 'Screen glitch'),
            ),
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.statusGlitch, disabled: statusGlitchDisabled, onChange: function (e) { patch({ statusGlitch: e.target.checked }) } }),
              React.createElement('span', null, 'Status glitch'),
            ),
          ),
        )
      }

      // ---------------- registrations ----------------
      slots.inject('shell.overlay', function () {
        return slots.register(
          { name: 'shell.overlay', id: 'cyberpunk-2077-overlay', order: -9999 },
          function () { return React.createElement(CyberOverlay) },
        )
      })

      slots.inject('conversation.composer.dock', function () {
        return slots.register(
          { name: 'conversation.composer.dock', id: 'cyberpunk-status', order: 100 },
          function () { return React.createElement(StatusStrip) },
        )
      })

      slots.inject('settings.section', function () {
        return slots.register(
          { name: 'settings.section', id: 'cyberpunk-2077', order: 25, label: 'Cyberpunk 2077' },
          function (props) { return React.createElement(CyberSettings, props) },
        )
      })

      // ---------------- cache-hit precision (2 decimals) ----------------
      // DSH rounds the stats-line cache-hit percentage to an integer before
      // rendering. The raw token buckets still live in the StatsLine fiber's
      // hook state, so we read them and rewrite "Cache hit 99%" into
      // "Cache hit 99.13%". Everything degrades to the stock integer label
      // if React changes its internals or the projection is unavailable.
      function reactFiberOf(node) {
        const keys = Object.keys(node)
        for (let i = 0; i < keys.length; i++) {
          if (keys[i].indexOf('__reactFiber$') === 0) return node[keys[i]]
        }
        return null
      }
      function usageFromStatsSpan(span) {
        let fiber = reactFiberOf(span)
        for (let hops = 0; fiber !== null && fiber !== undefined && hops < 24; hops++) {
          let hook = fiber.memoizedState
          while (hook !== null && hook !== undefined) {
            const value = hook.memoizedState
            if (value !== null && typeof value === 'object'
              && typeof value.cacheReadTokens === 'number'
              && typeof value.uncachedInputTokens === 'number'
              && typeof value.cacheWriteTokens === 'number') {
              return value
            }
            hook = hook.next
          }
          fiber = fiber.return
        }
        return null
      }
      function applyCacheHitPrecision(span) {
        const text = span.textContent === null ? '' : span.textContent.trim()
        const match = /^(Cache hit|缓存命中)\s+(\d+(?:\.\d+)?)%$/.exec(text)
        if (match === null) return
        const usage = usageFromStatsSpan(span)
        if (usage === null) return
        const denominator = usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
        if (denominator === 0) return
        const percent = (usage.cacheReadTokens / denominator * 100).toFixed(2)
        const next = match[1] + ' ' + percent + '%'
        if (span.textContent !== next) span.textContent = next
      }
      let statsLineObserver = null
      let statsLineRefreshQueued = false
      function refreshCacheHitPrecision() {
        statsLineRefreshQueued = false
        const root = document.querySelector('div:has(+ .cp-status)')
        if (root === null) return
        const spans = root.querySelectorAll(':scope > span')
        for (let i = 0; i < spans.length; i++) applyCacheHitPrecision(spans[i])
      }
      function queueCacheHitRefresh() {
        if (statsLineRefreshQueued) return
        statsLineRefreshQueued = true
        if (typeof queueMicrotask === 'function') queueMicrotask(refreshCacheHitPrecision)
        else Promise.resolve().then(refreshCacheHitPrecision)
      }
      if (typeof MutationObserver === 'function') {
        statsLineObserver = new MutationObserver(queueCacheHitRefresh)
        statsLineObserver.observe(document.body, { subtree: true, childList: true, characterData: true })
      }
      queueCacheHitRefresh()
      ctx.effect(function () {
        return function () {
          if (statsLineObserver !== null) statsLineObserver.disconnect()
        }
      })
    },
  }
}
