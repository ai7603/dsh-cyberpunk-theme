/* Live DOM inspection of the DSH web shell at 127.0.0.1:3080 */
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto('http://127.0.0.1:3080', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  // Make sure a conversation with content is open.
  await page.evaluate(() => {
    if (!document.querySelector('[data-chat-flow-kind]')) {
      const t = document.querySelector('[role="treeitem"]')
      if (t) t.click()
    }
  })
  await page.waitForTimeout(3000)

  const data = await page.evaluate(() => {
    const css = (el) => {
      const s = getComputedStyle(el)
      return {
        tag: el.tagName.toLowerCase(),
        radius: s.borderRadius,
        bg: s.backgroundColor,
        clip: s.clipPath,
        attrs: [...el.attributes]
          .filter((a) => a.name.startsWith('data-'))
          .map((a) => `${a.name}="${a.value}"`)
          .join(' '),
      }
    }
    const out = {
      themeActive: !!document.querySelector('.cp-overlay'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      hasChat: !!document.querySelector('[data-chat-flow-kind]'),
    }

    // Every visible rounded rectangle on the page (bg != transparent, radius > 0).
    const rounded = []
    const seen = new Set()
    const walk = (el, depth) => {
      if (depth > 16) return
      for (const c of el.children) {
        const s = getComputedStyle(c)
        const r = parseFloat(s.borderRadius)
        const bg = s.backgroundColor
        const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
        if (r > 0 && hasBg && c.offsetWidth > 40 && c.offsetHeight > 14) {
          const key = `${c.tagName}|${c.className}`
          if (!seen.has(key) && rounded.length < 70) {
            seen.add(key)
            const box = c.getBoundingClientRect()
            rounded.push({
              ...css(c),
              w: Math.round(box.width),
              h: Math.round(box.height),
              sample: c.outerHTML.slice(0, 140).replace(/\s+/g, ' '),
            })
          }
        }
        walk(c, depth + 1)
      }
    }
    walk(document.body, 0)
    out.rounded = rounded

    // First-child chains for the known anchors.
    const chain = (sel, label) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const arr = []
      let n = el
      for (let i = 0; i < 7 && n; i++) {
        arr.push(css(n))
        n = n.firstElementChild
      }
      return arr
    }
    out.userChain = chain('[data-chat-flow-kind="user"] [data-time-hover-root]', 'user')
    out.toolChain = chain('[data-chat-flow-kind="tool-call"] [data-tool]', 'tool')
    out.composerChain = chain('[data-composer-seat]', 'composer')

    const wm = document.querySelector('svg[viewBox="0 0 182 24"]')
    if (wm) {
      const arr = []
      let n = wm.parentElement
      for (let i = 0; i < 4 && n; i++) {
        arr.push(css(n))
        n = n.parentElement
      }
      out.newSessionChain = arr
    }
    return out
  })

  console.log(JSON.stringify(data, null, 2))
  await browser.close()
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
