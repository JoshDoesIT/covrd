import { chromium, devices } from 'playwright'
import path from 'path'
import fs from 'fs'

const url = 'http://localhost:5174/?app'
const outDir = path.resolve('docs/brand/screenshots')

async function capture() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const browser = await chromium.launch({ headless: true })

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const desktopPage = await desktopContext.newPage()
  await desktopPage.goto(url, { waitUntil: 'load' })
  await desktopPage.waitForTimeout(2000) // Give it time to load DB and render

  // Ensure style
  await desktopPage.evaluate(() => {
    const originalBody = document.body.innerHTML
    document.body.innerHTML = ''
    document.body.style.background = 'linear-gradient(135deg, #1A1B26, #24283B)'
    document.body.style.margin = '0'
    document.body.style.display = 'flex'
    document.body.style.alignItems = 'center'
    document.body.style.justifyContent = 'center'
    document.body.style.padding = '60px'
    document.body.style.minHeight = '100vh'
    document.body.style.boxSizing = 'border-box'
    const frame = document.createElement('div')
    frame.style.width = '1200px'
    frame.style.height = '750px'
    frame.style.background = '#0F111A'
    frame.style.borderRadius = '16px'
    frame.style.overflow = 'hidden'
    frame.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)'
    frame.style.display = 'flex'
    frame.style.flexDirection = 'column'
    const toolbar = document.createElement('div')
    toolbar.style.height = '32px'
    toolbar.style.background = '#1A1B26'
    toolbar.style.display = 'flex'
    toolbar.style.alignItems = 'center'
    toolbar.style.padding = '0 16px'
    toolbar.style.gap = '8px'
    toolbar.style.boxShadow = 'inset 0 -1px 0 rgba(255,255,255,0.05)'
    ;['#FF5F56', '#FFBD2E', '#27C93F'].forEach((color) => {
      const dot = document.createElement('div')
      dot.style.width = '12px'
      dot.style.height = '12px'
      dot.style.borderRadius = '50%'
      dot.style.background = color
      toolbar.appendChild(dot)
    })
    const content = document.createElement('div')
    content.style.position = 'relative'
    content.style.flex = '1'
    content.style.overflow = 'hidden'
    content.innerHTML = originalBody
    frame.appendChild(toolbar)
    frame.appendChild(content)
    document.body.appendChild(frame)
  })
  await desktopPage.screenshot({ path: path.join(outDir, 'app_desktop.png') })
  await desktopContext.close()

  // Mobile
  const mobileContext = await browser.newContext({
    ...devices['iPhone 13 Pro'],
    deviceScaleFactor: 3,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(url, { waitUntil: 'load' })
  await mobilePage.waitForTimeout(2000)

  // Ensure style
  await mobilePage.evaluate(() => {
    const originalBody = document.body.innerHTML
    document.body.innerHTML = ''
    document.body.style.background = 'linear-gradient(135deg, #1A1B26, #24283B)'
    document.body.style.margin = '0'
    document.body.style.display = 'flex'
    document.body.style.alignItems = 'center'
    document.body.style.justifyContent = 'center'
    document.body.style.padding = '40px'
    document.body.style.minHeight = '100vh'
    document.body.style.boxSizing = 'border-box'
    const frame = document.createElement('div')
    frame.style.width = '390px'
    frame.style.height = '844px'
    frame.style.background = '#0F111A'
    frame.style.borderRadius = '40px'
    frame.style.overflow = 'hidden'
    frame.style.boxShadow =
      '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px #333, inset 0 0 0 6px #000'
    frame.style.display = 'flex'
    frame.style.flexDirection = 'column'
    frame.style.position = 'relative'
    const notch = document.createElement('div')
    notch.style.position = 'absolute'
    notch.style.top = '6px'
    notch.style.left = '50%'
    notch.style.transform = 'translateX(-50%)'
    notch.style.width = '150px'
    notch.style.height = '30px'
    notch.style.background = '#000'
    notch.style.borderBottomLeftRadius = '16px'
    notch.style.borderBottomRightRadius = '16px'
    notch.style.zIndex = '9999'
    const content = document.createElement('div')
    content.style.position = 'relative'
    content.style.flex = '1'
    content.style.overflow = 'hidden'
    content.style.paddingTop = '12px'
    content.innerHTML = originalBody
    frame.appendChild(notch)
    frame.appendChild(content)
    document.body.appendChild(frame)
  })
  await mobilePage.screenshot({ path: path.join(outDir, 'app_mobile.png') })
  await mobileContext.close()

  await browser.close()
  console.log('Done screenshots')
}

capture().catch(console.error)
