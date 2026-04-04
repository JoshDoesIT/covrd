import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const url = 'http://localhost:5174/?app#schedule'
const outDir = path.resolve('docs/brand/screenshots')

async function capture() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const browser = await chromium.launch({ headless: true })

  // ==========================================
  // 1. Capture Raw Desktop (1536x960 16:10 Apple Aspect Ratio)
  // ==========================================
  // 1536px perfectly hugs the flexbox elements without overflowing
  // and without leaving vast empty space like 1920px (16:9) does.
  const desktopWidth = 1536
  const desktopHeight = 960

  const desktopContext = await browser.newContext({
    viewport: { width: desktopWidth, height: desktopHeight },
    deviceScaleFactor: 2,
  })
  await desktopContext.addInitScript(() => {
    localStorage.setItem('covrd-onboarding-complete', 'true')
  })

  const desktopPage = await desktopContext.newPage()
  await desktopPage.goto(url, { waitUntil: 'load' })
  await desktopPage.evaluate(async () => {
    await document.fonts.ready
  })
  await desktopPage.addStyleTag({
    content: '::-webkit-scrollbar { display: none !important; } body { overflow-x: hidden; }',
  })

  await desktopPage.keyboard.press('Control+k')
  await desktopPage.waitForSelector('.covrd-command-input', { state: 'visible', timeout: 5000 })
  await desktopPage.keyboard.type('demo', { delay: 50 })
  await desktopPage.waitForTimeout(500)
  await desktopPage.keyboard.press('Enter')
  await desktopPage.waitForTimeout(1000)

  await desktopPage.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })
  await desktopPage.setViewportSize({ width: desktopWidth, height: desktopHeight })
  await desktopPage.waitForTimeout(2000)

  const rawDesktopPath = path.join(outDir, 'raw_desktop.png')
  await desktopPage.screenshot({ path: rawDesktopPath, fullPage: false })
  await desktopContext.close()

  // ==========================================
  // 2. Capture Raw Mobile (400x850 Responsive CSS)
  // ==========================================
  const mobileWidth = 400
  const mobileHeight = 850

  const mobileContext = await browser.newContext({
    viewport: { width: mobileWidth, height: mobileHeight },
    deviceScaleFactor: 3,
  })
  await mobileContext.addInitScript(() => {
    localStorage.setItem('covrd-onboarding-complete', 'true')
  })

  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(url, { waitUntil: 'load' })
  await mobilePage.evaluate(async () => {
    await document.fonts.ready
  })
  await mobilePage.addStyleTag({
    content: '::-webkit-scrollbar { display: none !important; } body { overflow-x: hidden; }',
  })

  await mobilePage.keyboard.press('Control+k')
  await mobilePage.waitForSelector('.covrd-command-input', { state: 'visible', timeout: 5000 })
  await mobilePage.keyboard.type('demo', { delay: 50 })
  await mobilePage.waitForTimeout(500)
  await mobilePage.keyboard.press('Enter')
  await mobilePage.waitForTimeout(1500)

  await mobilePage.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollLeft > 0) el.scrollLeft = 0
    })
    window.scrollTo(0, 0)
  })

  await mobilePage.waitForTimeout(2000)

  const rawMobilePath = path.join(outDir, 'raw_mobile.png')
  await mobilePage.screenshot({ path: rawMobilePath, fullPage: false })
  await mobileContext.close()

  // ==========================================
  // 3. Composite Desktop
  // ==========================================
  const compositeContext = await browser.newContext({
    viewport: { width: 1700, height: 1100 },
    deviceScaleFactor: 2,
  })
  const compPage = await compositeContext.newPage()
  const desktopImgBase64 = fs.readFileSync(rawDesktopPath, 'base64')

  // Container matches exactly the source image width + 32px height for the taskbar
  await compPage.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background: linear-gradient(135deg, #1A1B26, #24283B); margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 60px; box-sizing: border-box;">
        <div style="width: 1536px; height: 992px; background: #0F111A; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1); display: flex; flex-direction: column;">
          <div style="height: 32px; background: #1A1B26; display: flex; align-items: center; padding: 0 16px; gap: 8px; box-shadow: inset 0 -1px 0 rgba(255,255,255,0.05); flex-shrink: 0;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #FF5F56;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #FFBD2E;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #27C93F;"></div>
          </div>
          <div style="position: relative; flex: 1; overflow: hidden; background: #0F111A;">
            <img src="data:image/png;base64,${desktopImgBase64}" style="width: 100%; height: 100%; display: block; object-fit: contain;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await compPage.waitForLoadState('networkidle')
  await compPage.screenshot({ path: path.join(outDir, 'app_desktop.png') })

  // ==========================================
  // 4. Composite Mobile
  // ==========================================
  await compPage.setViewportSize({ width: 600, height: 1000 })
  const mobileImgBase64 = fs.readFileSync(rawMobilePath, 'base64')

  await compPage.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background: linear-gradient(135deg, #1A1B26, #24283B); margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 40px; box-sizing: border-box;">
        <div style="width: 400px; height: 850px; background: #0F111A; border-radius: 40px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px #333, inset 0 0 0 6px #000; display: flex; flex-direction: column; position: relative;">
          <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 140px; height: 28px; background: #000; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; z-index: 9999;"></div>
          <div style="position: relative; flex: 1; overflow: hidden; background: #0F111A;">
            <img src="data:image/png;base64,${mobileImgBase64}" style="width: 100%; height: 100%; display: block; object-fit: contain;" />
          </div>
        </div>
      </body>
    </html>
  `)
  await compPage.waitForLoadState('networkidle')
  await compPage.screenshot({ path: path.join(outDir, 'app_mobile.png') })

  await compositeContext.close()
  await browser.close()

  // Cleaning up raw frames this time since we know our system works
  fs.unlinkSync(rawDesktopPath)
  fs.unlinkSync(rawMobilePath)

  console.log('Done screenshots')
}

capture().catch(console.error)
