// @ts-check
'use strict'

const { cpSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')

const root = join(__dirname, '..')
const src = join(root, 'src', 'flows', 'defaults')
const dest = join(root, 'flows', 'defaults')

if (!existsSync(src)) {
  console.log(`No flows to copy (${src} not found) — skipping.`)
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })

console.log(`Copied flows: ${src} → ${dest}`)
