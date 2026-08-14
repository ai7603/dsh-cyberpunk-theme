# DSH Cyberpunk 2077 Theme

A deep **Cyberpunk 2077 / Night City** reskin for
[DeepSeek Harness](https://github.com/deepseek-ai) (DSH). It retints the whole
shell, adds a CRT/neon atmosphere layer, restyles the brand, and drops a live
status strip under the composer — with a full in-app settings page.

> 中文摘要：一个把 DeepSeek Harness 整体换成《赛博朋克 2077》夜之城风格的动态 Cordis 插件 —— 霓虹配色 + 扫描线/暗角/边框彩带/故障闪烁 + 品牌多色流动 + composer 下方实时状态条（时间/日期/心跳/强调色），并带设置页可切换配色方案、4 套强调色与特效开关。

## What it looks like

- **Palette** — dark mode is blue-black with neon yellow `#fcee0a` /
  electric cyan `#00f0ff` / magenta `#ff2d6b`; light mode is a warm "Arasaka"
  paper tone with gold/red accents (readable, not just dark-mode-only).
- **Fonts** — Rajdhani + Chakra Petch for UI, Share Tech Mono for code/status.
- **Atmosphere** — CRT scanlines, corner vignette, a flowing neon ribbon along
  the frame border, and an occasional full-screen glitch.
- **Brand** — the top-left "DeepSeek Harness" wordmark flows through the
  cyberpunk palette and glitches (RGB split + jitter).
- **Status strip** — under the composer: live clock, date, `UPLINK ● ONLINE`
  heartbeat (Client→Host ping), and current accent — with glitch flicker.
  The shipped LLM stats line is tinted neon too.
- **Settings page** (sidebar → Settings → **Cyberpunk 2077**) — color-scheme
  switcher, 4 accent presets, and toggles for scanlines / screen glitch /
  status glitch.

All animations respect `prefers-reduced-motion`.

## What this is

This is a **Dynamic Cordis Plugin** for DSH — the runtime feature that extends
a running DSH process with Host/Client code (the `cordis_define` +
`cordis_run` flow). It is *not* a standalone npm package and does not persist
across a process restart by itself; the code here is the source you feed to
that feature (or a reference to port into a permanent composition package).

### Structure

```
.
├── index.js          # re-exports the client + host plugin factories
├── src/
│   ├── client.js     # client half (theme tokens, CSS, overlay, status strip, settings)
│   └── host.js       # host half (package-private `ping` RPC for the heartbeat)
├── package.json
├── LICENSE           # MIT
└── README.md
```

- `cyberpunkClientPlugin()` returns the client-half Cordis Plugin.
- `cyberpunkHostPlugin()` returns the host-half Cordis Plugin.

Each factory's body is exactly the plain-JavaScript "function body" the DSH
dynamic-plugin feature accepts as `code.client` / `code.host`.

## Usage

### A. Via the DSH web GUI (dynamic plugin)

1. Open DSH in the browser and start the dynamic-plugin flow.
2. Create a new Plugin (any 3–6 letter `idPrefix`, e.g. `cpunk`).
3. Paste the `return { … }` block from
   [`src/client.js`](./src/client.js) as the **client** code, and the
   `return { … }` block from [`src/host.js`](./src/host.js) as the **host**
   code.
4. Run it and approve the activation.

> Tip: the full Night City look reads best in **dark mode** — use
> Settings → Cyberpunk 2077 → **Night City (Dark)**, or the built-in
> Appearance setting.

### B. Port into a permanent composition package

To ship it as a persistent plugin (survives restart, mounts via `cordis.yml`),
wrap the same logic in a regular Cordis client plugin:

- replace the dynamic `styles.insert(css)` with your bundler's CSS
  (CSS modules / a stylesheet import);
- replace the `React.createElement(...)` calls with JSX (the code is
  otherwise plain Cordis);
- replace the dynamic `harness.handle` / `host.call` ping with your
  preferred client↔host bridge.

The theme service (`theme.overrideTokens`), the slot registrations
(`shell.overlay`, `conversation.composer.dock`, `settings.section`), the
token names, and the palette values carry over unchanged.

## Customization

- **Accent presets** live in the `ACCENTS` map in `src/client.js` — add/change
  a preset by editing its `brand`/`success`/`error`/`warn` light+dark pairs.
- **Palette** lives in `baseTokens` (accent-independent background/text/border
  tokens) — every value is a `{ light, dark }` pair.
- **Effect timing/intensity** — the `cp-ribbon`, `cp-brand`, `cp-glitch`,
  `cp-status-glitch`, and `cp-stats-glitch` keyframes (durations are the
  `…s infinite` values in the `MAIN_CSS` template string).

## License

[MIT](./LICENSE)
