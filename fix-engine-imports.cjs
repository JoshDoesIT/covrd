const fs = require('fs')
const path = require('path')

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f)
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback)
    } else {
      callback(dirPath)
    }
  })
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts')) return
  if (filePath.endsWith('engine/types.ts')) return

  let content = fs.readFileSync(filePath, 'utf8')
  let originalContent = content

  // Replacements
  content = content.replace(
    /import \{ Employee, Shift \} from '\.\.\/\.\.\/types'/g,
    "import type { EngineEmployee as Employee, EngineShift as Shift } from '../types'",
  )
  content = content.replace(
    /import \{ Shift, Employee \} from '\.\.\/\.\.\/types'/g,
    "import type { EngineShift as Shift, EngineEmployee as Employee } from '../types'",
  )
  content = content.replace(
    /import \{ CoverageRequirement, Shift \} from '\.\.\/\.\.\/types'/g,
    "import type { EngineCoverageRequirement as CoverageRequirement, EngineShift as Shift } from '../types'",
  )
  content = content.replace(
    /import \{ CoverageRequirement \} from '\.\.\/\.\.\/types'/g,
    "import type { EngineCoverageRequirement as CoverageRequirement } from '../types'",
  )

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content)
    console.log('Fixed:', filePath)
  }
}

walkDir('./src/engine', processFile)
console.log('Done!')
