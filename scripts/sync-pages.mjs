import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs'

copyFileSync('dist/index.html', 'index.html')
copyFileSync('dist/ask-config.json', 'ask-config.json')
rmSync('assets', { recursive: true, force: true })
mkdirSync('assets', { recursive: true })
cpSync('dist/assets', 'assets', { recursive: true })
