import type { Food } from './data'

export type ChatTurn = { role: 'user' | 'model'; text: string }

export async function loadAskEndpoint(): Promise<string> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}ask-config.json`, { cache: 'no-store' })
    if (!response.ok) return ''
    const data = await response.json() as { endpoint?: unknown }
    return typeof data.endpoint === 'string' && /^https:\/\//.test(data.endpoint) ? data.endpoint.replace(/\/$/, '') : ''
  } catch { return '' }
}

export async function askLive(endpoint: string, question: string, history: ChatTurn[], catalog: Food[]): Promise<string> {
  const foodFacts = catalog.filter(f => question.toLowerCase().includes(f.name.split(',')[0].toLowerCase())).slice(0, 5).map(f => ({ name: f.name, protein: f.protein }))
  const response = await fetch(`${endpoint}/ask`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history: history.slice(-6), foodFacts }),
  })
  const data = await response.json() as { answer?: string; error?: string }
  if (!response.ok || !data.answer) throw new Error(data.error || 'Live answers are unavailable right now.')
  return data.answer
}
