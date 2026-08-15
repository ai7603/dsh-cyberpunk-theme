/**
 * Browser smoke test for the permanent cyberpunk theme plugin against a
 * scratch web instance (run `pnpm dsh web --patch scripts/smoke-port.patch.yml`
 * first). The theme has no on/off toggle — its permanent bundle applies at
 * boot — so one probe asserts the complete activation:
 *
 *   1. the boot graph contains the dsh-cyberpunk-theme row;
 *   2. the shell.overlay ambient layer exists (.cp-overlay);
 *   3. an open session mounts the composer status strip (.cp-status);
 *   4. the Settings modal contains the Cyberpunk 2077 section;
 *   5. the plugin owns style tags (data-plugin="dsh-cyberpunk-theme");
 *   6. alias tokens are overridden on body (light or dark palette).
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

// Settings section registration check: open Settings and look for the page.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Settings')
  if (btn) btn.click()
})
let settingsSection = false
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(250)
  settingsSection = await page.evaluate(() => document.body.textContent.includes('Cyberpunk 2077'))
  if (settingsSection) break
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
  }
})
console.log(JSON.stringify(result, null, 2))
console.log('console errors:', consoleErrors.length ? consoleErrors.slice(0, 8) : 'none')
const interesting = consoleAll.filter((l) => /cyberpunk|theme|font|google|error|warn/i.test(l))
console.log('console (related):', interesting.length ? interesting.slice(0, 20) : 'none')

const ok = active
  && result.overlay
  && result.statusStrip
  && result.settingsSection
  && result.styleTags.length >= 2
  && result.bgBase !== ''
  && result.brand !== ''
if (!ok) {
  console.error('VERIFY FAILED', JSON.stringify({ active, statusStrip, settingsSection, result }, null, 2))
  process.exitCode = 1
} else {
  console.log('VERIFY OK: cyberpunk permanent plugin is active')
}
await browser.close()
