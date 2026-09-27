const MODEL = 'gemini-3.5-flash-lite'
const SYSTEM = `You are Nouri, an educational food and feeding guide for parents of babies starting solids and young children. Reply warmly in plain English, in about 100 to 180 words. Answer the actual question. Nutrition amounts vary by preparation and brand. Use supplied food facts only as approximate per-100-g values, and never invent a precise nutrient number or claim that one food meets a child's full daily requirements. Do not claim a product, ingredient, or additive is safe or harmful based only on its name. For allergens, remind parents to check the original package and their care plan. Do not diagnose illness or provide individual medical treatment. If a question describes breathing trouble, severe swelling, or another urgent symptom, advise immediate local emergency help. For individual growth, diet, or allergy concerns, suggest a qualified clinician. Say when you do not know. Do not pretend to have searched sources or inspected an image.`

const reply = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
})

export default {
  async fetch(request) {
    if (request.method === 'GET') return reply({ available: Boolean(process.env.GEMINI_API_KEY) })
    if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405)
    if (!process.env.GEMINI_API_KEY) return reply({ error: 'Live answers are not configured yet.' }, 503)
    if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'Send JSON.' }, 415)

    let body
    try {
      const raw = await request.text()
      if (raw.length > 8000) return reply({ error: 'Message is too long.' }, 413)
      body = JSON.parse(raw)
    } catch { return reply({ error: 'Invalid request.' }, 400) }

    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    if (!question || question.length > 600) return reply({ error: 'Enter a question under 600 characters.' }, 400)
    const history = Array.isArray(body.history) ? body.history.slice(-6)
      .filter(m => ['user', 'model'].includes(m?.role) && typeof m?.text === 'string')
      .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 600) }] })) : []
    const facts = Array.isArray(body.foodFacts) ? body.foodFacts.slice(0, 5)
      .filter(f => typeof f?.name === 'string' && typeof f?.protein === 'number' && f.protein >= 0 && f.protein <= 100)
      .map(f => `${f.name.slice(0, 60)}: approximately ${f.protein} g protein per 100 g`) : []
    const prompt = facts.length ? `Available food estimates (check preparation): ${facts.join('; ')}\n\nQuestion: ${question}` : question

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
        signal: AbortSignal.timeout(20000),
      })
      if (response.status === 429) return reply({ error: 'The free AI quota is busy. Please try again later.' }, 429)
      if (!response.ok) return reply({ error: 'Live answers are unavailable right now.' }, 502)
      const result = await response.json()
      const answer = result.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim()
      if (!answer) return reply({ error: 'No answer was returned. Please try another question.' }, 502)
      return reply({ answer, model: MODEL })
    } catch { return reply({ error: 'Could not reach the AI service. Please try again later.' }, 502) }
  },
}
