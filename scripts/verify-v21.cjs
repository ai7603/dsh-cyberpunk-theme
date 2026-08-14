/* Verification page: stays connected to 127.0.0.1:3080 while the plugin is
   dispatched, then reports computed styles of the cut-corner targets. */
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://127.0.0.1:3080', { waitUntil: 'domcontentloaded' })

  // Wait (up to 90s) for the client half to arrive via dispatch.
  let active = false
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(1000)
    active = await page.evaluate(() => !!document.querySelector('.cp-overlay'))
    if (active) break
  }
  await page.waitForTimeout(1500)

  const res = await page.evaluate(() => {
    const cs = (el) => {
      if (!el) return null
      const s = getComputedStyle(el)
      return {
        tag: el.tagName.toLowerCase(),
        clip: s.clipPath,
        radius: s.borderRadius,
        bg: s.backgroundColor,
        borderColor: s.borderColor,
        filter: s.filter,
      }
    }
    const rules = []
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const sel = rule.selectorText || ''
          if (sel.includes('data-chat-flow-kind') || sel.includes('data-composer-card') || sel.includes('viewBox="0 0 182 24"')) {
            rules.push(sel)
          }
        }
      } catch (e) {}
    }
    return {
      themeActive: !!document.querySelector('.cp-overlay'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      composer: cs(document.querySelector('[data-composer-card]')),
      newSession: cs(document.querySelector('button:has(svg[viewBox="0 0 182 24"])')),
      ribbon: cs(document.querySelector('.cp-ribbon')),
      statusStrip: !!document.querySelector('.cp-status'),
      injectedRules: rules,
    }
  })
  console.log(JSON.stringify(res, null, 2))

  // Screenshot for the record.
  const shot = process.argv[2] || '/tmp/cp-v21.png'
  await page.screenshot({ path: shot, fullPage: false })
  console.log('screenshot ->', shot)
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
