export type Food = {
  id: string
  name: string
  emoji: string
  category: 'Protein' | 'Fruit & veg' | 'Grains' | 'Dairy & alternatives'
  color: string
  protein: number
  note: string
  allergens: string[]
  tip: string
  local?: boolean
}

// Rounded illustrative values per 100 g. Actual foods, preparation and labels vary.
export const foods: Food[] = [
  { id: 'salmon', name: 'Salmon, cooked', emoji: '🐟', category: 'Protein', color: 'peach', protein: 22, note: 'Protein and omega-3 fats', allergens: ['Fish'], tip: 'Serve fully cooked, boneless, and in a texture your child can manage.' },
  { id: 'egg', name: 'Egg, cooked', emoji: '🥚', category: 'Protein', color: 'butter', protein: 13, note: 'Protein and choline', allergens: ['Egg'], tip: 'Cook thoroughly and adapt the texture for your child.' },
  { id: 'tofu', name: 'Firm tofu', emoji: '🧈', category: 'Protein', color: 'mint', protein: 10, note: 'Plant protein', allergens: ['Soy'], tip: 'Cut into suitable pieces and check the ingredient list for other allergens.' },
  { id: 'yogurt', name: 'Plain yogurt', emoji: '🥣', category: 'Dairy & alternatives', color: 'lilac', protein: 4, note: 'Protein and calcium', allergens: ['Milk'], tip: 'Choose plain varieties when comparing added sugar on labels.' },
  { id: 'broccoli', name: 'Broccoli, cooked', emoji: '🥦', category: 'Fruit & veg', color: 'mint', protein: 3, note: 'Fiber and vitamin C', allergens: [], tip: 'Steam until soft and serve in an age-appropriate shape.' },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'Fruit & veg', color: 'mint', protein: 2, note: 'Unsaturated fats and fiber', allergens: [], tip: 'Mash or slice to a texture your child can manage.' },
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruit & veg', color: 'butter', protein: 1, note: 'Fruit and fiber', allergens: [], tip: 'Serve in an age-appropriate texture and supervise eating.' },
  { id: 'oats', name: 'Oatmeal, cooked', emoji: '🥣', category: 'Grains', color: 'peach', protein: 3, note: 'Whole grain and fiber', allergens: [], tip: 'Prepare with a soft texture and check packaged oats for cross-contact notes.' },
  { id: 'chicken', name: 'Chicken breast, cooked', emoji: '🍗', category: 'Protein', color: 'peach', protein: 31, note: 'Protein rich poultry', allergens: [], tip: 'Cook thoroughly and serve moist, soft pieces suited to your child.' },
  { id: 'lentils', name: 'Lentils, cooked', emoji: '🫘', category: 'Protein', color: 'butter', protein: 9, note: 'Plant protein and fiber', allergens: [], tip: 'Cook until soft and mash or serve in a suitable texture.' },
  { id: 'chickpeas', name: 'Chickpeas, cooked', emoji: '🫘', category: 'Protein', color: 'mint', protein: 9, note: 'Plant protein and fiber', allergens: [], tip: 'Mash or flatten whole chickpeas to reduce choking risk.' },
  { id: 'rice', name: 'Brown rice, cooked', emoji: '🍚', category: 'Grains', color: 'butter', protein: 3, note: 'Whole grain', allergens: [], tip: 'Cook until soft and offer a variety of grains over time.' },
  { id: 'quinoa', name: 'Quinoa, cooked', emoji: '🍚', category: 'Grains', color: 'peach', protein: 4, note: 'Grain with some protein', allergens: [], tip: 'Cook thoroughly and offer in a soft texture.' },
  { id: 'sweet-potato', name: 'Sweet potato, cooked', emoji: '🍠', category: 'Fruit & veg', color: 'peach', protein: 2, note: 'Vegetable with fiber', allergens: [], tip: 'Cook until soft and mash or cut to an age-appropriate shape.' },
  { id: 'carrot', name: 'Carrot, cooked', emoji: '🥕', category: 'Fruit & veg', color: 'peach', protein: 1, note: 'Vegetable variety', allergens: [], tip: 'Cook until soft. Hard raw carrot pieces can be a choking hazard.' },
  { id: 'peas', name: 'Peas, cooked', emoji: '🫛', category: 'Fruit & veg', color: 'mint', protein: 5, note: 'Vegetable with some protein', allergens: [], tip: 'Cook until soft and mash or flatten for younger eaters.' },
  { id: 'apple', name: 'Apple, stewed', emoji: '🍎', category: 'Fruit & veg', color: 'butter', protein: 0.3, note: 'Fruit variety', allergens: [], tip: 'Cook until soft. Avoid hard raw chunks for younger children.' },
  { id: 'pear', name: 'Pear, ripe', emoji: '🍐', category: 'Fruit & veg', color: 'mint', protein: 0.4, note: 'Fruit variety', allergens: [], tip: 'Serve ripe and soft in a texture your child can manage.' },
  { id: 'strawberry', name: 'Strawberries', emoji: '🍓', category: 'Fruit & veg', color: 'lilac', protein: 0.7, note: 'Fruit variety', allergens: [], tip: 'Cut into an age-appropriate shape and supervise eating.' },
  { id: 'cottage-cheese', name: 'Cottage cheese', emoji: '🧀', category: 'Dairy & alternatives', color: 'lilac', protein: 11, note: 'Dairy protein', allergens: ['Milk'], tip: 'Check the label for sodium and milk allergens before serving.' },
]

export type Meal = { id: string; foodId: string; grams: number; meal: string; date: string; foodSnapshot?: Food }
export type Post = { id: string; category: string; title: string; body: string; author: string; time: string; replies: string[]; local?: boolean }

export const samplePosts: Post[] = [
  { id: 's1', category: 'First foods', title: 'What helped your little one get used to new textures?', body: 'We are trying small changes at each meal. I would love to hear what made mealtimes feel calmer for your family.', author: 'Maya R.', time: 'Sample discussion', replies: ['We let our toddler explore the food without pressure. It took time, but meals became more relaxed.'] },
  { id: 's2', category: 'Parent wellbeing', title: 'Some days I worry I am getting everything wrong', body: 'The amount of advice online feels overwhelming. What helps you step back and feel more grounded?', author: 'Jules T.', time: 'Sample discussion', replies: ['Talking to another parent helped me remember that one difficult day is just one day.'] },
  { id: 's3', category: 'Development', title: 'Ideas for playful mealtimes?', body: 'My child wants to do everything independently. Any gentle ideas for practicing new skills at the table?', author: 'Rina L.', time: 'Sample discussion', replies: [] },
  { id: 's4', category: 'Health questions', title: 'How do you prepare questions for a checkup?', body: 'I keep forgetting what I wanted to ask our pediatrician. Do you use a small list or notes on your phone?', author: 'Avery P.', time: 'Sample discussion', replies: [] },
]

export const sources = [
  { label: 'CDC: Introducing solid foods', url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html' },
  { label: 'CDC: Foods and drinks to encourage', url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-encourage.html' },
  { label: 'CDC: Choking hazards', url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html' },
  { label: 'AAP: Picky eating', url: 'https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx' },
  { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
]
