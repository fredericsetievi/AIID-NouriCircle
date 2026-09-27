import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const base = import.meta.env.BASE_URL
for (const [rel, href] of [
  ['manifest', `${base}manifest.webmanifest`],
  ['icon', `${base}icons/icon-192.png`],
  ['apple-touch-icon', `${base}icons/icon-192.png`],
]) {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  document.head.append(link)
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // The site remains usable if offline support cannot be installed.
    })
  })
}
