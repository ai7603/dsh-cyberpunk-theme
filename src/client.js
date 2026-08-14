/**
 * DeepSeek Harness — Cyberpunk 2077 Theme (client half)
 *
 * Reskins the whole DSH shell into a Night City look:
 *   - neon token palette (dark: blue-black + neon yellow/cyan/magenta;
 *     light: warm "Arasaka" paper + gold/red)
 *   - CRT scanlines, vignette, flowing frame ribbon, screen glitch
 *   - flowing + glitching brand wordmark
 *   - a status strip under the composer (clock / date / UPLINK heartbeat /
 *     accent) with glitch flicker, plus a neon LLM stats line
 *   - a settings page (color scheme, 4 accent presets, effect toggles)
 *
 * This is the plain "function body" form accepted by the DSH dynamic-plugin
 * feature as `code.client`. In the web GUI, paste the `return { … }` block
 * below as the client code; the file also works as a plain ES module.
 */
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
      const state = { accent: 'yellow', scanlines: true, glitch: true, statusGlitch: true, version: 0 }
      function patch(p) {
        Object.assign(state, p)
        state.version += 1
        listeners.forEach(function (fn) { try { fn() } catch (e) {} })
      }
      function subscribe(fn) {
        listeners.add(fn)
        return function () { listeners.delete(fn) }
      }

      // ---------------- theme token layer + scheme sync ----------------
      const SOURCE = 'cyberpunk-2077-theme'
      let disposeTokens = theme.overrideTokens(SOURCE, tokensFor(state.accent))
      ctx.effect(function () { return function () { disposeTokens() } })
      ctx.on('theme/change', function () { patch({}) })

      function applyAccent(key) {
        disposeTokens = theme.overrideTokens(SOURCE, tokensFor(key))
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
html, body { font-family: var(--cp-font) !important; }
button { font-family: var(--cp-font) !important; }
code, pre, kbd, samp { font-family: var(--cp-mono) !important; }
::selection { background: var(--dsw-alias-brand-primary); color: #08090f; }
:focus-visible { outline: 1px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, #0b0c14), color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, #0b0c14));
  border: 2px solid var(--dsw-alias-bg-base);
  border-radius: 6px;
}

/* brand wordmark + whale logo → flowing palette + glitch flicker */
svg[viewBox="0 0 182 24"],
svg[viewBox="0 0 23.16 17.04"] {
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
  0%, 90%, 100% { transform: none; filter: none; opacity: 1; }
  91% { transform: translateX(-2px) skewX(-8deg); opacity: 0.8; filter: drop-shadow(2px 0 0 rgba(255,45,85,0.85)) drop-shadow(-2px 0 0 rgba(0,240,255,0.85)); }
  92% { transform: translateX(2px) skewX(6deg); opacity: 1; filter: drop-shadow(-2px 0 0 rgba(255,45,85,0.85)) drop-shadow(2px 0 0 rgba(0,240,255,0.85)); }
  93% { transform: translateX(-1px); opacity: 0.85; filter: drop-shadow(3px 0 0 rgba(255,45,85,0.7)) drop-shadow(-3px 0 0 rgba(0,240,255,0.7)); }
  94% { transform: none; filter: none; opacity: 1; }
}

/* ambient overlay */
.cp-overlay { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.cp-layer { position: absolute; inset: 0; }
.cp-scanlines { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px); }
[data-ds-dark-theme] .cp-scanlines { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px); }
.cp-vignette { background: radial-gradient(ellipse at center, transparent 50%, rgba(4,5,10,0.5) 100%); }
.cp-ribbon {
  position: absolute; inset: 0; padding: 2px;
  background: linear-gradient(90deg, #fcee0a 0%, #00f0ff 25%, #ff2d6b 50%, #b026ff 75%, #fcee0a 100%);
  background-size: 200% 100%;
  animation: cp-ribbon 7s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: 0.85;
  filter: drop-shadow(0 0 5px rgba(0,240,255,0.28));
}
@keyframes cp-ribbon {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.cp-glitch {
  opacity: 0;
  background: linear-gradient(180deg,
    transparent 0%, transparent 24%,
    color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent) 24.2%,
    transparent 24.6%,
    transparent 58%,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent) 58.2%,
    transparent 58.7%,
    transparent 100%);
  animation: cp-glitch 12s steps(1) infinite;
}
@keyframes cp-glitch {
  0%, 100% { opacity: 0; transform: translateX(0); }
  2% { opacity: 0.55; transform: translateX(-5px); }
  3.5% { opacity: 0; }
  4.2% { opacity: 0.4; transform: translateX(4px); }
  5.5% { opacity: 0; transform: translateX(0); }
  46% { opacity: 0; }
  47.2% { opacity: 0.5; transform: translateX(3px); }
  48.6% { opacity: 0; transform: translateX(0); }
  78% { opacity: 0; }
  79.3% { opacity: 0.35; transform: translateX(-3px); }
  80.6% { opacity: 0; transform: translateX(0); }
}

/* shipped LLM stats line → flowing gradient text + glow + glitch */
div:has(+ .cp-status) {
  background: linear-gradient(90deg, #fcee0a, #00f0ff, #ff2d6b, #b026ff, #fcee0a);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.03em;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  padding-bottom: 2px;
  animation: cp-stats-flow 6s linear infinite, cp-stats-glitch 5s steps(1) infinite;
}
div:has(+ .cp-status) > span[aria-hidden] { color: transparent; }
@keyframes cp-stats-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes cp-stats-glitch {
  0%, 90%, 100% { transform: none; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent)); opacity: 1; }
  91% { transform: translateX(-2px) skewX(-5deg); opacity: 0.8; filter: drop-shadow(2px 0 0 rgba(255,45,85,0.85)) drop-shadow(-2px 0 0 rgba(0,240,255,0.85)); }
  92% { transform: translateX(2px); opacity: 1; filter: drop-shadow(-2px 0 0 rgba(255,45,85,0.85)) drop-shadow(2px 0 0 rgba(0,240,255,0.85)); }
  93% { transform: translateX(-1px); opacity: 0.7; filter: drop-shadow(3px 0 0 rgba(255,45,85,0.7)) drop-shadow(-3px 0 0 rgba(0,240,255,0.7)); }
  94% { transform: none; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent)); opacity: 1; }
}

/* status strip under the composer stats line */
.cp-status {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  font-family: var(--cp-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--dsw-alias-label-secondary);
}
.cp-status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.cp-status-time { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); }
.cp-status-net { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); }
.cp-status-net[data-net='offline'] { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); }
.cp-status-net[data-net='sync'] { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
.cp-status--glitch .cp-status-chip { animation: cp-status-glitch 5s steps(1) infinite; }
.cp-status--glitch .cp-status-chip:nth-child(2) { animation-delay: -1.2s; }
.cp-status--glitch .cp-status-chip:nth-child(3) { animation-delay: -2.4s; }
.cp-status--glitch .cp-status-chip:nth-child(4) { animation-delay: -3.6s; }
@keyframes cp-status-glitch {
  0%, 88%, 100% { transform: none; text-shadow: none; opacity: 1; }
  89% { transform: translateX(-2px) skewX(-4deg); text-shadow: 2px 0 #ff2d55, -2px 0 #00f0ff; }
  90% { transform: translateX(2px); text-shadow: -2px 0 #ff2d55, 2px 0 #00f0ff; }
  91% { transform: translateX(-1px); opacity: 0.7; text-shadow: 2px 0 #ff2d55, -2px 0 #00f0ff; }
  92% { transform: none; text-shadow: none; opacity: 1; }
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
@media (prefers-reduced-motion: reduce) {
  svg[viewBox="0 0 182 24"], svg[viewBox="0 0 23.16 17.04"] { animation: none !important; color: var(--dsw-alias-brand-primary) !important; }
  div:has(+ .cp-status) { animation: none !important; }
  .cp-glitch { animation: none !important; opacity: 0 !important; }
  .cp-ribbon { animation: none !important; }
  .cp-status--glitch .cp-status-chip { animation: none !important; }
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
        const children = []
        if (st.scanlines) children.push(React.createElement('div', { key: 'scan', className: 'cp-layer cp-scanlines' }))
        children.push(React.createElement('div', { key: 'vig', className: 'cp-layer cp-vignette' }))
        if (st.glitch) children.push(React.createElement('div', { key: 'glitch', className: 'cp-layer cp-glitch' }))
        children.push(React.createElement('div', { key: 'ribbon', className: 'cp-ribbon' }))
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
        }, [])
        const netText = net === 'online' ? '● ONLINE' : (net === 'offline' ? '● OFFLINE' : '● SYNC')
        return React.createElement('div', { className: 'cp-status' + (st.statusGlitch ? ' cp-status--glitch' : '') },
          React.createElement('span', { className: 'cp-status-chip cp-status-time' }, 'Local ', timeStr(now)),
          React.createElement('span', { className: 'cp-status-chip' }, dateStr(now)),
          React.createElement('span', { className: 'cp-status-chip cp-status-net', 'data-net': net }, 'Uplink ', netText),
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
        const accentBtns = Object.keys(ACCENTS).map(function (key) {
          return React.createElement('button', {
            key: key,
            type: 'button',
            className: 'cp-btn' + (st.accent === key ? ' cp-btn--active' : ''),
            onClick: function () { applyAccent(key) },
          }, ACCENTS[key].label)
        })
        const schemeBtns = ['dark', 'system', 'light'].map(function (id) {
          const isActive = theme.getTheme().preference === id
          const label = id === 'dark' ? 'Night City (Dark)' : (id === 'system' ? 'System' : 'Light')
          return React.createElement('button', {
            key: id,
            type: 'button',
            className: 'cp-btn' + (isActive ? ' cp-btn--active' : '') + (id === 'dark' ? ' cp-btn--dark' : ''),
            onClick: function () { setScheme(id) },
          }, label)
        })
        return React.createElement('div', { className: 'cp-settings' },
          React.createElement('h2', { className: 'cp-settings-title' }, 'Cyberpunk 2077'),
          React.createElement('p', { className: 'cp-settings-sub' }, 'Night City reskin for the DSH shell. Dark mode shows the full neon look.'),
          React.createElement('div', { className: 'cp-group' },
            React.createElement('div', { className: 'cp-group-label' }, 'Color scheme'),
            React.createElement('div', { className: 'cp-row' }, schemeBtns),
            React.createElement('p', { className: 'cp-note' }, 'Current: ', React.createElement('strong', null, schemeLabel()), ' (', activeScheme === 'dark' ? 'dark palette active' : 'light palette active', ')'),
          ),
          React.createElement('div', { className: 'cp-group' },
            React.createElement('div', { className: 'cp-group-label' }, 'Accent'),
            React.createElement('div', { className: 'cp-row' }, accentBtns),
          ),
          React.createElement('div', { className: 'cp-group' },
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.scanlines, onChange: function (e) { patch({ scanlines: e.target.checked }) } }),
              React.createElement('span', null, 'Scanlines'),
            ),
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.glitch, onChange: function (e) { patch({ glitch: e.target.checked }) } }),
              React.createElement('span', null, 'Screen glitch'),
            ),
            React.createElement('label', { className: 'cp-toggle' },
              React.createElement('input', { type: 'checkbox', checked: st.statusGlitch, onChange: function (e) { patch({ statusGlitch: e.target.checked }) } }),
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
    },
  }
}
