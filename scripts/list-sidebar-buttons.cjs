/* List sidebar buttons with stable anchors to find the real New Session button. */
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://127.0.0.1:3080', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  const data = await page.evaluate(() => {
    const sidebar = document.querySelector('[data-slot="sidebar"]') || document.body
    const out = []
    for (const btn of sidebar.querySelectorAll('button')) {
      const r = btn.getBoundingClientRect()
      const svgs = [...btn.querySelectorAll('svg')].map((s) => {
        const vb = s.getAttribute('viewBox') || ''
        const w = s.getAttribute('width')
        const h = s.getAttribute('height')
        return `vb=${vb} w=${w} h=${h}`
      })
      out.push({
        aria: btn.getAttribute('aria-label'),
        cls: (btn.className || '').toString().slice(0, 40),
        w: Math.round(r.width),
        h: Math.round(r.height),
        svgs,
        text: (btn.textContent || '').trim().slice(0, 30),
      })
    }
    return out
  })
  console.log(JSON.stringify(data, null, 2))
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
