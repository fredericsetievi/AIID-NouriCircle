import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs'

copyFileSync('dist/index.html', 'index.html')
copyFileSync('dist/ask-config.json', 'ask-config.json')
rmSync('assets', { recursive: true, force: true })
mkdirSync('assets', { recursive: true })
cpSync('dist/assets', 'assets', { recursive: true })
copyFileSync('dist/manifest.webmanifest', 'manifest.webmanifest')
copyFileSync('dist/sw.js', 'sw.js')
rmSync('icons', { recursive: true, force: true })
cpSync('dist/icons', 'icons', { recursive: true })
