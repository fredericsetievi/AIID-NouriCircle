export type Product = {
  barcode: string
  name: string
  brand: string
  ingredients: string
  serving: string
  protein: number | null
  sugars: number | null
  sodium: number | null
  allergens: string[]
  traces: string[]
  url: string
}

type RecordData = Record<string, unknown>
const string = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null
const tags = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').map(v => v.replace(/^en:/, '').replaceAll('-', ' ')) : []

export async function lookupProduct(rawBarcode: string, signal?: AbortSignal): Promise<Product | null> {
  const barcode = rawBarcode.replace(/\s/g, '')
  if (!/^\d{8,14}$/.test(barcode)) throw new Error('Enter the 8 to 14 digits printed under the barcode.')
  // The v2 product endpoint is still supported and exposes the documented
  // per-100g nutriment fields. Migrate to v3 when its nutrition schema settles.
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=code,product_name,brands,ingredients_text,serving_size,nutriments,allergens_tags,traces_tags`
  const response = await fetch(url, { signal })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('The food database is unavailable. Try again, or use a label photo below.')
  const body = await response.json() as RecordData
  const product = body.product as RecordData | undefined
  if (!product || body.status !== 1) return null
  const nutrients = (product.nutriments || {}) as RecordData
  return {
    barcode,
    name: string(product.product_name) || 'Unnamed product',
    brand: string(product.brands),
    ingredients: string(product.ingredients_text),
    serving: string(product.serving_size),
    protein: number(nutrients.proteins_100g),
    sugars: number(nutrients.sugars_100g),
    sodium: number(nutrients.sodium_100g),
    allergens: tags(product.allergens_tags),
    traces: tags(product.traces_tags),
    url: `https://world.openfoodfacts.org/product/${barcode}`,
  }
}
