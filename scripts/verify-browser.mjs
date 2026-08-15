/**
 * Browser smoke test for the permanent cyberpunk theme plugin against a
 * scratch web instance (run `pnpm dsh web --patch scripts/smoke-port.patch.yml`
 * first). The theme activates at boot; the probe asserts complete activation,
 * checks all three performance tiers, then flips the master switch:
 *
 *   1. the boot graph contains the dsh-cyberpunk-theme row;
 *   2. the shell.overlay ambient layer exists (.cp-overlay);
 *   3. an open session mounts the composer status strip (.cp-status);
 *   4. the Settings modal contains the Cyberpunk 2077 section;
 *   5. the plugin owns style tags (data-plugin="dsh-cyberpunk-theme");
 *   6. alias tokens are overridden on body (light or dark palette);
 *   7. Full mounts ribbon+glitch; Balanced keeps the cheap transform-only
 *      edge ribbon plus static atmosphere; both Balanced and Eco keep the
 *      intermittent glitch layer (Eco mounts glitch alone);
 *   8. master switch OFF removes .cp-overlay/.cp-status and
 *      data-cp-enabled/data-cp-perf while keeping the settings page;
 *   9. master switch ON restores all of the above.
 */
import { chromium } from '/Users/allen/Documents/Projects/deepseek-harness/apps/web/node_modules/playwright/index.mjs'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3092'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const consoleErrors = []
const consoleAll = []
page.on('console', (msg) => {
  consoleAll.push(`[${msg.type()}] ${msg.text()}`)
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

// The permanent bundle is `immediately` and applies as soon as slots/theme
// resolve — poll for the overlay instead of guessing a fixed delay.
let active = false
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(500)
  active = await page.evaluate(() => Boolean(document.querySelector('.cp-overlay')))
  if (active) break
}

// The status strip is session-scoped (conversation.composer.dock): try each
// sidebar row until one opens a session and the dock renders.
let statusStrip = false
if (active) {
  const rows = await page.evaluate(() => [...document.querySelectorAll('[role="treeitem"]')].map(
    (row) => row.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '',
  ))
  for (let index = 0; index < rows.length && !statusStrip; index++) {
    await page.evaluate((i) => {
      const row = document.querySelectorAll('[role="treeitem"]')[i]
      if (row) row.click()
    }, index)
    for (let j = 0; j < 8; j++) {
      await page.waitForTimeout(250)
      statusStrip = await page.evaluate(() => Boolean(document.querySelector('.cp-status')))
      if (statusStrip) break
    }
  }
}

// Settings section registration check: open Settings, click the plugin's nav
// entry, then confirm the section body (not just the nav label) mounted.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Settings')
  if (btn) btn.click()
})
let settingsSection = false
for (let i = 0; i < 20 && !settingsSection; i++) {
  await page.waitForTimeout(250)
  const clicked = await page.evaluate(() => {
    const nav = [...document.querySelectorAll('button')].find(
      (b) => (b.textContent || '').trim() === 'Cyberpunk 2077',
    )
    if (nav) { nav.click(); return true }
    return false
  })
  if (!clicked) continue
  for (let j = 0; j < 8; j++) {
    await page.waitForTimeout(200)
    settingsSection = await page.evaluate(() => Boolean(document.querySelector('.cp-settings-title')))
    if (settingsSection) break
  }
}

// Performance tiers: Balanced (default) must not mount the repaint-heavy
// ribbon/glitch layers and must have zero cp-* CSS animations running.
let perfProbe = null
if (settingsSection) {
  const clickPerf = (label) => page.evaluate((label) => {
    const btn = [...document.querySelectorAll('.cp-settings .cp-btn')].find(
      (b) => (b.textContent || '').trim() === label,
    )
    if (btn) btn.click()
  }, label)
  const probe = () => page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 182 24"]')
    const status = document.querySelector('.cp-status')
    const statsRoot = status?.previousElementSibling ?? null
    const cacheSpan = statsRoot
      ? [...statsRoot.querySelectorAll(':scope > span')].find((s) => /^(Cache hit|缓存命中)/.test(s.textContent ?? ''))
      : null
    return {
      perf: document.documentElement.getAttribute('data-cp-perf'),
      overlay: Boolean(document.querySelector('.cp-overlay')),
      ribbon: Boolean(document.querySelector('.cp-ribbon')),
      glitch: Boolean(document.querySelector('.cp-glitch')),
      glitchDuration: document.querySelector('.cp-glitch')
        ? getComputedStyle(document.querySelector('.cp-glitch')).animationDuration
        : '',
      grid: Boolean(document.querySelector('.cp-grid')),
      scanlines: Boolean(document.querySelector('.cp-scanlines')),
      vignette: Boolean(document.querySelector('.cp-vignette')),
      brandAnimation: svg ? getComputedStyle(svg).animationName : '',
      statusGlitch: Boolean(document.querySelector('.cp-status--glitch')),
      cacheHit: cacheSpan ? cacheSpan.textContent.trim() : '',
      cpAnimations: document.getAnimations()
        .map((a) => a.animationName)
        .filter((n) => typeof n === 'string' && n.startsWith('cp-')),
    }
  })

  await clickPerf('Full')
  let fullProbe = null
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200)
    fullProbe = await probe()
    if (fullProbe.ribbon && fullProbe.glitch) break
  }

  await clickPerf('Eco')
  let ecoProbe = null
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200)
    ecoProbe = await probe()
    if (ecoProbe.perf === 'eco' && ecoProbe.overlay && ecoProbe.glitch && !ecoProbe.ribbon) break
  }

  await clickPerf('Balanced')
  let balancedProbe = null
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200)
    balancedProbe = await probe()
    if (balancedProbe.perf === 'balanced' && balancedProbe.overlay
      && balancedProbe.ribbon && balancedProbe.glitch && balancedProbe.grid) break
  }

  perfProbe = { full: fullProbe, balanced: balancedProbe, eco: ecoProbe }
}

// Master switch: turn the theme off, assert native-look state, then back on.
let master = null
let masterOff = false
let masterOn = false
if (settingsSection) {
  master = await page.evaluate(() => {
    const label = [...document.querySelectorAll('.cp-toggle--master')].find(
      (el) => (el.textContent || '').includes('Enable Cyberpunk theme'),
    )
    const input = label?.querySelector('input[type="checkbox"]')
    return input ? { checked: input.checked } : null
  })

  if (master?.checked) {
    await page.evaluate(() => {
      const label = [...document.querySelectorAll('.cp-toggle--master')].find(
        (el) => (el.textContent || '').includes('Enable Cyberpunk theme'),
      )
      label?.querySelector('input[type="checkbox"]')?.click()
    })
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(200)
      masterOff = await page.evaluate(() => (
        !document.documentElement.hasAttribute('data-cp-enabled')
        && !document.documentElement.hasAttribute('data-cp-perf')
        && !document.querySelector('.cp-overlay')
        && !document.querySelector('.cp-status')
        && Boolean(document.querySelector('.cp-settings-title'))
      ))
      if (masterOff) break
    }

    await page.evaluate(() => {
      const label = [...document.querySelectorAll('.cp-toggle--master')].find(
        (el) => (el.textContent || '').includes('Enable Cyberpunk theme'),
      )
      label?.querySelector('input[type="checkbox"]')?.click()
    })
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(200)
      masterOn = await page.evaluate(() => (
        document.documentElement.hasAttribute('data-cp-enabled')
        && document.documentElement.hasAttribute('data-cp-perf')
        && Boolean(document.querySelector('.cp-overlay'))
        && Boolean(document.querySelector('.cp-status'))
      ))
      if (masterOn) break
    }
  }
}

const result = await page.evaluate(() => {
  const cs = getComputedStyle(document.body)
  const boot = window.__DSH_BOOT__
  const entry = boot?.entries?.find((e) => e.id === 'dsh-cyberpunk-theme')
  return {
    bootEntry: entry ?? null,
    overlay: Boolean(document.querySelector('.cp-overlay')),
    statusStrip: Boolean(document.querySelector('.cp-status')),
    settingsSection: document.body.textContent.includes('Cyberpunk 2077'),
    styleTags: [...document.querySelectorAll('style[data-plugin="dsh-cyberpunk-theme"]')].map(
      (t) => t.dataset.pluginCss ?? t.dataset.plugin,
    ),
    bgBase: cs.getPropertyValue('--dsw-alias-bg-base').trim(),
    brand: cs.getPropertyValue('--dsw-alias-brand-primary').trim(),
    sidebarFill: cs.getPropertyValue('--dsw-specific-sidebar-fill').trim(),
    perfTier: document.documentElement.getAttribute('data-cp-perf'),
    enabled: document.documentElement.hasAttribute('data-cp-enabled'),
  }
})
result.master = master
result.masterOff = masterOff
result.masterOn = masterOn
result.perfProbe = perfProbe
console.log(JSON.stringify(result, null, 2))
console.log('console errors:', consoleErrors.length ? consoleErrors.slice(0, 8) : 'none')
const interesting = consoleAll.filter((l) => /cyberpunk|theme|font|google|error|warn/i.test(l))
console.log('console (related):', interesting.length ? interesting.slice(0, 20) : 'none')

const microGlitchNames = new Set([
  'cp-glitch',
  'cp-brand-glitch',
  'cp-stats-glitch',
  'cp-status-glitch',
  'cp-ribbon-flow-x',
  'cp-ribbon-flow-y',
])
const balancedAnims = result.perfProbe?.balanced?.cpAnimations ?? []
const ecoAnims = result.perfProbe?.eco?.cpAnimations ?? []
const cacheOk = (text) => !text || /^(Cache hit|缓存命中) \d+\.\d{2}%$/.test(text)
const ok = active
  && result.overlay
  && result.statusStrip
  && result.settingsSection
  && result.styleTags.length >= 2
  && result.bgBase !== ''
  && result.brand !== ''
  && result.enabled
  && result.master?.checked !== false
  && result.masterOff
  && result.masterOn
  && result.perfProbe?.full?.ribbon
  && result.perfProbe?.full?.glitch
  && result.perfProbe?.full?.glitchDuration === '6s'
  && result.perfProbe?.balanced?.overlay
  && result.perfProbe?.balanced?.ribbon
  && result.perfProbe?.balanced?.glitch
  && result.perfProbe?.balanced?.glitchDuration === '6s'
  && result.perfProbe?.balanced?.grid
  && result.perfProbe?.balanced?.statusGlitch
  && balancedAnims.includes('cp-glitch')
  && balancedAnims.includes('cp-brand-glitch')
  && balancedAnims.includes('cp-stats-glitch')
  && balancedAnims.includes('cp-status-glitch')
  && balancedAnims.every((n) => microGlitchNames.has(n))
  && cacheOk(result.perfProbe?.balanced?.cacheHit)
  && result.perfProbe?.eco?.perf === 'eco'
  && result.perfProbe?.eco?.overlay
  && result.perfProbe?.eco?.glitch
  && result.perfProbe?.eco?.glitchDuration === '6s'
  && result.perfProbe?.eco?.statusGlitch
  && ecoAnims.includes('cp-glitch')
  && ecoAnims.includes('cp-brand-glitch')
  && ecoAnims.includes('cp-stats-glitch')
  && ecoAnims.includes('cp-status-glitch')
  && ecoAnims.every((n) => microGlitchNames.has(n))
  && cacheOk(result.perfProbe?.eco?.cacheHit)
  && !result.perfProbe?.eco?.ribbon
  && !result.perfProbe?.eco?.grid
if (!ok) {
  console.error('VERIFY FAILED', JSON.stringify({ active, statusStrip, settingsSection, result }, null, 2))
  process.exitCode = 1
} else {
  console.log('VERIFY OK: plugin active; performance tiers and master switch behave correctly')
}
await browser.close()
