import { foods, type Food, type Meal } from './data.ts'

export function localDay() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function proteinFor(food: Food, grams: number) {
  return food.protein * grams / 100
}

export function analyzeLabel(text: string, allergies: string[]) {
  const lower = text.toLowerCase()
  const matches = allergies.filter(a => new RegExp(`\\b${a.toLowerCase()}\\b`).test(lower))
  const known = ['milk', 'egg', 'fish', 'soy', 'wheat', 'peanut', 'sesame', 'tree nuts', 'shellfish']
  const mentioned = known.filter(a => new RegExp(`\\b${a}\\b`).test(lower))
  const proteinMatch = text.match(/protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i)
  const sugarMatch = text.match(/(?:added sugars?|sugars?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i)
  const sodiumMatch = text.match(/sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg/i)
  const additives = ['sodium benzoate', 'potassium sorbate', 'artificial color', 'red 40', 'yellow 5', 'sucralose', 'aspartame'].filter(a => lower.includes(a))
  return {
    matches, mentioned, additives,
    protein: proteinMatch ? Number(proteinMatch[1]) : null,
    sugar: sugarMatch ? Number(sugarMatch[1]) : null,
    sodium: sodiumMatch ? Number(sodiumMatch[1]) : null,
  }
}

export function answerQuestion(question: string, age: number, allergies: string[], meals: Meal[]) {
  const q = question.toLowerCase()
  const source = (label: string, url: string) => ({ label, url })
  if (/allerg|reaction|rash|swelling|breath/.test(q)) return {
    title: 'Allergies need a careful check',
    body: `Saved allergies: ${allergies.length ? allergies.join(', ') : 'none yet'}. Check the complete package label every time, including “contains” and cross-contact statements. A label scan can miss text. If you suspect a reaction, seek advice from a clinician. Trouble breathing or swelling needs urgent medical care.`,
    source: source('AAP: Food allergies in children', 'https://www.healthychildren.org/english/healthy-living/nutrition/pages/food-allergies-in-children.aspx'),
  }
  if (/salmon|fish|protein|portion|how much/.test(q)) return {
    title: 'Put a portion in context',
    body: `In this demo, 30 g of cooked salmon is estimated at about 6.6 g of protein. Select a food and enter its actual amount in Explore to see the estimate. There is no single salmon portion that guarantees a child’s whole day of nutrition. Needs vary with age, growth, and the rest of the diet. Serve fish fully cooked and boneless, and ask your child’s clinician about personal targets.`,
    source: source('USDA FoodData Central', 'https://fdc.nal.usda.gov/'),
  }
  if (/label|ingredient|additive|synthetic|preservative|packag|sugar/.test(q)) return {
    title: 'Read the whole label',
    body: 'An unfamiliar ingredient name does not by itself mean a food is harmful. Check the ingredient list, allergens, serving size and nutrition panel together. The label tool can pull out text and highlight terms, but the original package is the source to verify before serving.',
    source: source('CDC: Foods and drinks to avoid or limit', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html'),
  }
  if (/picky|fussy|refus|texture|variety/.test(q)) return {
    title: 'Variety builds over time',
    body: 'One meal or one day does not tell the whole story. Keep offering different foods without pressure and let your child explore age-appropriate textures. If eating concerns persist or growth worries you, bring them to your child’s clinician.',
    source: source('AAP: Tips for picky eaters', 'https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx'),
  }
  if (/chok|safe|cut|prepare/.test(q)) return {
    title: 'Preparation matters',
    body: `For a child ${age} months old, texture and shape still matter as much as the food itself. Supervise eating, adapt foods to your child’s skills, and review choking hazards before serving. Ask a clinician for advice about your child’s development.`,
    source: source('CDC: Choking hazards', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'),
  }
  const today = meals.filter(m => m.date === localDay())
  const groups = new Set(today.map(m => foods.find(f => f.id === m.foodId)?.category).filter(Boolean))
  return {
    title: 'Start with the whole day',
    body: `${today.length ? `You logged ${today.length} food${today.length === 1 ? '' : 's'} from ${groups.size} food group${groups.size === 1 ? '' : 's'} today. ` : ''}Around six months, many babies begin solid foods alongside milk feeds. A range of foods across time can help. Tell me a food or a specific concern, or add foods to the meal log to explore the day. For individual nutrition or health needs, check with your child’s clinician.`,
    source: source('CDC: Foods and drinks to encourage', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-encourage.html'),
  }
}
