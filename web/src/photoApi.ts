export type PhotoAnalysis = {
  summary: string
  foods: { name: string; nutrients: string }[]
  possibleAllergens: string[]
  uncertainties: string[]
  nextStep: string
}

function toJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) { reject(new Error('Could not prepare this image.')); return }
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open this image.')) }
    image.src = url
  })
}

export async function analyzeFoodPhoto(file: File): Promise<PhotoAnalysis> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a food photo first.')
  if (file.size > 12_000_000) throw new Error('Choose an image under 12 MB.')
  const dataUrl = await toJpeg(file)
  const imageBase64 = dataUrl.split(',')[1]
  if (imageBase64.length * 0.75 > 2_000_000) throw new Error('Photo is too large after resizing. Try another image.')
  const isHostedElsewhere = window.location.hostname.endsWith('github.io') || window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost'
  const endpoint = isHostedElsewhere ? 'https://aiid-nouri-circle.vercel.app/api/photo' : '/api/photo'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType: 'image/jpeg', imageBase64 }),
  })
  const data = await response.json() as { analysis?: PhotoAnalysis; error?: string }
  if (!response.ok || !data.analysis) throw new Error(data.error || 'Photo analysis is unavailable right now.')
  return data.analysis
}
