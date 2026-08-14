/* Measure the New Session button vs the brand wordmark inside it, to pick a
   cut size that visibly cuts the button but never touches the brand glyphs. */
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://127.0.0.1:3080', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  const data = await page.evaluate(() => {
    const btn = document.querySelector('button:has(svg[viewBox="0 0 182 24"])')
    if (!btn) return { found: false }
    const btnRect = btn.getBoundingClientRect()
    const wm = btn.querySelector('svg[viewBox="0 0 182 24"]')
    const plus = btn.querySelector('svg[width="14"][height="14"]')
    const rel = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        left: Math.round((r.left - btnRect.left) * 10) / 10,
        top: Math.round((r.top - btnRect.top) * 10) / 10,
        right: Math.round((btnRect.right - r.right) * 10) / 10,
        bottom: Math.round((btnRect.bottom - r.bottom) * 10) / 10,
        w: Math.round(r.width),
        h: Math.round(r.height),
      }
    }
    const cs = getComputedStyle(btn)
    return {
      found: true,
      button: { w: Math.round(btnRect.width), h: Math.round(btnRect.height) },
      display: cs.display,
      alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      gap: cs.gap,
      padding: cs.padding,
      wordmark: rel(wm),
      plusIcon: rel(plus),
    }
  })
  console.log(JSON.stringify(data, null, 2))
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
