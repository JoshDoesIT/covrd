import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const draftPath = path.resolve('artifacts/og-image-draft.png')

async function capture() {
  if (!fs.existsSync(path.resolve('artifacts'))) {
    fs.mkdirSync(path.resolve('artifacts'), { recursive: true })
  }
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1024, height: 1024 })

  // Read existing logo dark directly if feasible, or recreate the text
  // The user said: "og image still shows "Every Shift. Covrd." ... can we update the og image to match?"
  const html = `
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 1024px;
            height: 1024px;
            background: #11131A; /* Base dark background */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
          }
          /* Glows */
          .glow1 {
            position: absolute;
            top: -150px;
            right: -150px;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(100, 108, 255, 0.4) 0%, rgba(17, 19, 26, 0) 70%);
            border-radius: 50%;
            filter: blur(80px);
          }
          .glow2 {
            position: absolute;
            bottom: -200px;
            left: -200px;
            width: 900px;
            height: 900px;
            background: radial-gradient(circle, rgba(100, 108, 255, 0.3) 0%, rgba(17, 19, 26, 0) 70%);
            border-radius: 50%;
            filter: blur(100px);
          }
          .logo {
            font-family: 'Outfit', sans-serif;
            font-size: 260px;
            font-weight: 800;
            letter-spacing: -10px;
            color: #FFFFFF;
            /* Outline implemented using text-shadow for better cross-browser or stroke */
            -webkit-text-stroke: 6px #000000;
            line-height: 1;
            margin-bottom: 20px;
            margin-top: -50px;
            z-index: 10;
          }
          .logo span {
            color: #646cff; /* purple color for 'd' */
          }
          .slogan {
            font-size: 60px;
            font-weight: 500;
            color: #FFFFFF;
            z-index: 10;
            margin-top: 20px;
            letter-spacing: -1px;
          }
        </style>
      </head>
      <body>
        <div class="glow1"></div>
        <div class="glow2"></div>
        <div class="logo">covr<span>d</span></div>
        <div class="slogan">Every shift, covrd.</div>
      </body>
    </html>
  `
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000) // give fonts time to load
  await page.screenshot({ path: draftPath })

  await browser.close()
  console.log('Draft OG image captured at ' + draftPath)
}

capture().catch(console.error)
