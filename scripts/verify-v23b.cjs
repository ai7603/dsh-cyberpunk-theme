/* Verify v23 round 2: click the MODEL trigger, then the effort pane. */
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

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => !(b.className || '').toString().includes('brand') && (b.className || '').toString().includes('newSession'),
    )
    if (btn) btn.click()
  })
  await page.waitForTimeout(2500)

  // Click the model trigger (aria-haspopup="menu").
  const clicked = await page.evaluate(() => {
    const card = document.querySelector('[data-composer-card]')
    const btn = [...card.querySelectorAll('button')].find((b) => b.getAttribute('aria-haspopup') === 'menu')
    if (!btn) return null
    btn.click()
    return (btn.textContent || '').trim().slice(0, 60)
  })
  console.log('model trigger clicked:', clicked)
  await page.waitForTimeout(800)

  const modelMenu = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[role="menu"]')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          clip: getComputedStyle(el).clipPath,
          items: [...el.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')].map((i) => (i.textContent || '').trim().slice(0, 40)),
        }
      })
    return items
  })
  console.log('MODEL MENU:', JSON.stringify(modelMenu, null, 2))

  // Open the effort pane.
  const effortClicked = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[role="menuitem"]')]
    const target = items.find((i) => /effort|reasoning|strength|思考/i.test(i.textContent || ''))
    if (!target) return null
    target.click()
    return (target.textContent || '').trim().slice(0, 40)
  })
  console.log('effort item clicked:', effortClicked)
  await page.waitForTimeout(800)

  const effortPane = await page.evaluate(() => {
    const radios = [...document.querySelectorAll('[role="menuitemradio"]')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { text: (el.textContent || '').trim().slice(0, 40), y: Math.round(r.y), clip: getComputedStyle(el).clipPath, checked: el.getAttribute('aria-checked') }
      })
    return radios
  })
  console.log('EFFORT PANE:', JSON.stringify(effortPane, null, 2))

  await page.screenshot({ path: process.argv[2] || '/tmp/cp-v23-model.png' })
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
