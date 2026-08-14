/* Verify v23: model selector + reasoning-effort menus must render fully
   visible (the composer cut now lives on ::before, not on the card). */
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

  // Enter a session so the composer shows the model trigger.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => !(b.className || '').toString().includes('brand') && (b.className || '').toString().includes('newSession'),
    )
    if (btn) btn.click()
  })
  await page.waitForTimeout(2500)

  // Find the model trigger inside the composer card.
  const trigger = await page.evaluate(() => {
    const card = document.querySelector('[data-composer-card]')
    if (!card) return null
    const cands = [...card.querySelectorAll('button')].filter((b) => {
      const t = (b.textContent || '').trim()
      return t.length > 0 || b.hasAttribute('aria-expanded') || b.hasAttribute('aria-haspopup')
    })
    return cands.map((b) => ({
      text: (b.textContent || '').trim().slice(0, 60),
      ariaExpanded: b.getAttribute('aria-expanded'),
      ariaHaspopup: b.getAttribute('aria-haspopup'),
      ariaLabel: b.getAttribute('aria-label'),
      role: b.getAttribute('role'),
      w: Math.round(b.getBoundingClientRect().width),
      h: Math.round(b.getBoundingClientRect().height),
    }))
  })
  console.log('TRIGGERS:', JSON.stringify(trigger, null, 2))

  // Click the most likely model trigger (first candidate with text).
  const clicked = await page.evaluate(() => {
    const card = document.querySelector('[data-composer-card]')
    const cands = [...card.querySelectorAll('button')].filter((b) => (b.textContent || '').trim().length > 0)
    const btn = cands[0]
    if (!btn) return false
    btn.click()
    return true
  })
  console.log('clicked:', clicked)
  await page.waitForTimeout(800)

  const menu = await page.evaluate(() => {
    const card = document.querySelector('[data-composer-card]')
    const cr = card ? card.getBoundingClientRect() : null
    const menus = [...document.querySelectorAll('[role="menu"], [role="menuitem"], [role="menuitemradio"], [data-slot="conversation.input.overlay"] [role]')]
      .filter((el) => el.offsetParent !== null || true)
    const visible = menus
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
          role: el.getAttribute('role'),
          text: (el.textContent || '').trim().slice(0, 50),
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          aboveCard: cr ? r.bottom <= cr.top : null,
          clip: cs.clipPath,
          display: cs.display,
          visibility: cs.visibility,
        }
      })
      .slice(0, 12)
    return { cardRect: cr ? { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), h: Math.round(cr.height) } : null, visible }
  })
  console.log('MENU:', JSON.stringify(menu, null, 2))

  await page.screenshot({ path: process.argv[2] || '/tmp/cp-v23-menu.png' })
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
