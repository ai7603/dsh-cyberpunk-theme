/* Verify v22: brand button must have NO clip; real New Session button must
   have the 10px cut-corner polygon. */
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://127.0.0.1:3080', { waitUntil: 'domcontentloaded' })

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
      return { tag: el.tagName.toLowerCase(), clip: s.clipPath, radius: s.borderRadius, bg: s.backgroundColor, borderColor: s.borderColor }
    }
    const brand = document.querySelector('button:has(> svg[viewBox="0 0 182 24"])')
    const newSession = [...document.querySelectorAll('button')].find(
      (b) => !(b.className || '').toString().includes('brand') && (b.className || '').toString().includes('newSession'),
    )
    return {
      themeActive: !!document.querySelector('.cp-overlay'),
      brand: cs(brand),
      newSession: cs(newSession),
      composer: cs(document.querySelector('[data-composer-card]')),
    }
  })
  console.log(JSON.stringify(res, null, 2))
  const shot = process.argv[2] || '/tmp/cp-v22.png'
  await page.screenshot({ path: shot })
  console.log('screenshot ->', shot)
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
