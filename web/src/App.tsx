import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Camera, Check, ChevronDown, ChevronRight,
  CircleHelp, ClipboardList, Heart, Home, Leaf, Menu, MessageCircle, Plus,
  ScanLine, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, UploadCloud, Users, X,
} from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { Capacitor } from '@capacitor/core'
import { Camera as NativeCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { App as NativeApp } from '@capacitor/app'
import { foods, samplePosts, sources, type Food, type Meal, type Post } from './data'
import { analyzeLabel, answerQuestion, localDay, proteinFor } from './logic'
import { lookupProduct, type Product } from './openFoodFacts'
import { askLive, loadAskEndpoint, type ChatTurn } from './askApi'
import { analyzeFoodPhoto, type PhotoAnalysis } from './photoApi'

type Page = 'home' | 'explore' | 'label' | 'ask' | 'circle'
type Child = { name: string; age: number; allergies: string[] }
const allergenOptions = ['Milk', 'Egg', 'Fish', 'Soy', 'Wheat', 'Peanut', 'Sesame', 'Tree nuts', 'Shellfish']
const categories = ['All', 'First foods', 'Development', 'Health questions', 'Parent wellbeing']
const nav = [
  { page: 'home', label: 'Overview', icon: Home },
  { page: 'explore', label: 'Explore foods', icon: Search },
  { page: 'label', label: 'Check food', icon: ScanLine },
  { page: 'ask', label: 'Ask Nouri', icon: Sparkles },
  { page: 'circle', label: 'Parent circle', icon: Users },
] as const

function persisted<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)) }
function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brand-mark"><Leaf size={compact ? 20 : 25} strokeWidth={2.5} /></span><span>Nouri<span className="brand-light">Circle</span></span></div>
}
function App() {
  const [page, setPage] = useState<Page>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [child, setChild] = useState<Child>(() => persisted('nc-child', { name: 'Little one', age: 18, allergies: [] }))
  const [meals, setMeals] = useState<Meal[]>(() => persisted('nc-meals', []))
  const [customFoods, setCustomFoods] = useState<Food[]>(() => persisted('nc-custom-foods', []))
  const [posts, setPosts] = useState<Post[]>(() => persisted('nc-posts', []))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showSources, setShowSources] = useState(false)
  const [guideStep, setGuideStep] = useState(() => localStorage.getItem('nc-guide-done') ? -1 : 0)
  const finishGuide = () => { localStorage.setItem('nc-guide-done', '1'); setGuideStep(-1) }
  const navigate = (next: Page) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listener = NativeApp.addListener('backButton', () => {
      if (guideStep >= 0) { finishGuide(); return }
      if (selectedFood) { setSelectedFood(null); return }
      if (settingsOpen) { setSettingsOpen(false); return }
      if (showSources) { setShowSources(false); return }
      if (mobileMenu) { setMobileMenu(false); return }
      if (page !== 'home') navigate('home')
      else void NativeApp.exitApp()
    })
    return () => { void listener.then(handle => handle.remove()) }
  }, [page, guideStep, selectedFood, settingsOpen, showSources, mobileMenu])
  const changeChild = (value: Child) => { setChild(value); save('nc-child', value) }
  const changeMeals = (value: Meal[]) => { setMeals(value); save('nc-meals', value) }
  const changeCustomFoods = (value: Food[]) => { setCustomFoods(value); save('nc-custom-foods', value) }
  const changePosts = (value: Post[]) => { setPosts(value); save('nc-posts', value) }
  const catalog = [...foods, ...customFoods]
  const mealFood = (meal: Meal) => meal.foodSnapshot || catalog.find(f => f.id === meal.foodId)
  const todayMeals = meals.filter(m => m.date === localDay())
  const dailyProtein = todayMeals.reduce((sum, m) => { const food = mealFood(m); return sum + (food ? proteinFor(food, m.grams) : 0) }, 0)
  const groups = new Set(todayMeals.map(m => mealFood(m)?.category).filter(Boolean))

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
      <div className="sidebar-top"><Logo /><button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20} /></button></div>
      <div className="sidebar-caption">A softer space for growing together.</div>
      <div className="nav-label">YOUR SPACE</div>
      <nav aria-label="Main navigation">{nav.map(item => <button key={item.page} className={`nav-item ${page === item.page ? 'active' : ''}`} onClick={() => navigate(item.page)}><item.icon size={19} strokeWidth={2} /><span>{item.label}</span>{page === item.page && <span className="active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="note-icon"><Heart size={20} fill="currentColor" /></span><strong>Little steps count.</strong><p>There is no perfect plate. Learn at your own pace.</p></div>
        <button className="sidebar-help" onClick={() => { setMobileMenu(false); setGuideStep(0) }}><CircleHelp size={17} /> How to use NouriCircle <ChevronRight size={16} /></button>
        <button className="sidebar-help" onClick={() => setShowSources(true)}><BookOpen size={17} /> Sources & guidance <ChevronRight size={16} /></button>
      </div>
    </aside>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={22} /></button><div className="topbar-crumb">NouriCircle <ChevronRight size={14} /> <strong>{nav.find(n => n.page === page)?.label}</strong></div><div className="topbar-actions"><button className="icon-button" onClick={() => setGuideStep(0)} aria-label="How to use NouriCircle" title="How to use NouriCircle"><CircleHelp size={19} /></button><span className="prototype-pill"><span /> PROTOTYPE</span><button className="profile-button" onClick={() => setSettingsOpen(true)} aria-label="Edit child profile"><span className="profile-avatar">👶</span><span className="profile-text"><strong>{child.name}</strong><small>{child.age} months</small></span><ChevronDown size={15} /></button></div></header>
      <div className="content">
        {page === 'home' && <HomePage child={child} catalog={catalog} todayMeals={todayMeals} dailyProtein={dailyProtein} groups={groups.size} navigate={navigate} openFood={setSelectedFood} removeMeal={(id) => changeMeals(meals.filter(m => m.id !== id))} />}
        {page === 'explore' && <ExplorePage child={child} catalog={catalog} customFoods={customFoods} changeCustomFoods={changeCustomFoods} openFood={setSelectedFood} />}
        {page === 'label' && <LabelPage child={child} />}
        {page === 'ask' && <AskPage child={child} meals={meals} catalog={catalog} navigate={navigate} />}
        {page === 'circle' && <CirclePage posts={posts} changePosts={changePosts} />}
        <footer className="footer"><span>Made for curious parents. Built as a learning prototype.</span><button onClick={() => setShowSources(true)}>Sources & important notes <ArrowRight size={14} /></button></footer>
      </div>
    </main>
    <nav className="mobile-tabs" aria-label="Mobile navigation">{nav.map(item => <button key={item.page} className={page === item.page ? 'active' : ''} aria-current={page === item.page ? 'page' : undefined} onClick={() => navigate(item.page)}><item.icon size={22} /><span>{item.page === 'explore' ? 'Foods' : item.page === 'label' ? 'Scan' : item.page === 'circle' ? 'Circle' : item.page === 'home' ? 'Home' : 'Ask'}</span></button>)}</nav>
    {settingsOpen && <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}><div className="modal settings-modal" role="dialog" aria-modal="true" aria-label="Child profile" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close"><X size={20} /></button><div className="modal-eyebrow"><Settings2 size={16} /> YOUR CHILD'S PROFILE</div><h2>A little context helps.</h2><p>Only saved on this browser. Use a nickname if you like.</p><label className="form-label">Nickname<input value={child.name} maxLength={25} onChange={e => changeChild({ ...child, name: e.target.value })} /></label><label className="form-label">Age in months<input type="number" min="6" max="120" value={child.age} onChange={e => changeChild({ ...child, age: Math.max(6, Math.min(120, Number(e.target.value) || 6)) })} /></label><div className="form-label">Known allergies <small>Choose only diagnosed or confirmed allergies</small></div><div className="chip-grid">{allergenOptions.map(a => <button key={a} className={`choice-chip ${child.allergies.includes(a) ? 'selected' : ''}`} onClick={() => changeChild({ ...child, allergies: child.allergies.includes(a) ? child.allergies.filter(x => x !== a) : [...child.allergies, a] })}>{child.allergies.includes(a) && <Check size={14} />}{a}</button>)}</div><button className="button primary full" onClick={() => setSettingsOpen(false)}>Done <ArrowRight size={17} /></button></div></div>}
    {selectedFood && <FoodModal food={selectedFood} child={child} onClose={() => setSelectedFood(null)} onAdd={(grams, meal) => { changeMeals([{ id: crypto.randomUUID(), foodId: selectedFood.id, foodSnapshot: selectedFood, grams, meal, date: localDay() }, ...meals]); setSelectedFood(null); navigate('home') }} />}
    {showSources && <div className="modal-backdrop" onMouseDown={() => setShowSources(false)}><div className="modal sources-modal" role="dialog" aria-modal="true" aria-label="Sources and notes" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={() => setShowSources(false)} aria-label="Close"><X size={20} /></button><div className="modal-eyebrow"><BookOpen size={16} /> THE SMALL PRINT, MADE CLEAR</div><h2>Sources & important notes</h2><p>This prototype offers educational information and approximate food data. It cannot decide whether a food is safe or whether a child has met personal nutrition needs. Check the original package for allergens and ask your child's clinician for individual advice.</p><p>Portion calculations use rounded, illustrative protein values per 100 g. Preparation, brand, and serving size change the result. Ask Nouri uses live AI only when its secure service is connected; otherwise it shows prepared responses. Forum posts stay in this browser and are not moderated.</p><div className="source-list">{sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<ArrowRight size={15} /></a>)}</div></div></div>}
    {guideStep >= 0 && <Guide step={guideStep} next={() => setGuideStep(guideStep + 1)} back={() => setGuideStep(guideStep - 1)} finish={finishGuide} open={(destination) => { finishGuide(); if (destination === 'profile') setSettingsOpen(true); else navigate(destination) }} />}
  </div>
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) { return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div> }
const guide = [
  { icon: '👋', title: 'Welcome to NouriCircle', body: 'A simple place to explore food, keep a meal log, and find a starting point for your questions. Your child profile and log stay in this browser.', action: 'Set up child profile', destination: 'profile' as const },
  { icon: '🥑', title: 'Explore food and portions', body: 'Choose a food, enter the amount prepared, and add it to today’s meal log. You can also save your own food information on this device. Protein values are estimates, not daily targets.', action: 'Explore foods', destination: 'explore' as const },
  { icon: '🔎', title: 'Check a food photo or label', body: 'Photograph a meal for general nutrition clues, or check a packaged food by barcode or label photo. A photo cannot measure exact portions or prove a food is safe.', action: 'Check food', destination: 'label' as const },
  { icon: '💜', title: 'Questions and community', body: 'Ask Nouri can answer live once its secure service is connected. Until then it shows prepared guidance. Parent circle posts stay on this device.', action: 'Go to overview', destination: 'home' as const },
  { icon: '📱', title: 'Keep NouriCircle on your phone', body: 'On Android, open this site in Chrome, tap the three-dot menu, then choose Install app or Add to Home screen. On iPhone, open it in Safari, tap Share, then Add to Home Screen. Open the new icon for a screen without a browser address bar. Live lookups still need internet.', action: 'Go to overview', destination: 'home' as const },
]
function Guide({ step, next, back, finish, open }: { step: number; next: () => void; back: () => void; finish: () => void; open: (destination: Page | 'profile') => void }) {
  const item = guide[step]
  return <div className="modal-backdrop" onMouseDown={finish}><div className="modal guide-modal" role="dialog" aria-modal="true" aria-label="How to use NouriCircle" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={finish} aria-label="Close guide"><X size={20} /></button><div className="eyebrow">GETTING STARTED · {step + 1} OF {guide.length}</div><div className="guide-art" aria-hidden="true">{item.icon}</div><h2>{item.title}</h2><p>{item.body}</p><div className="guide-dots" aria-label={`Step ${step + 1} of ${guide.length}`}>{guide.map((_, index) => <span key={index} className={index === step ? 'active' : ''} />)}</div><div className="guide-actions"><button className="button secondary" onClick={step ? back : finish}>{step ? 'Back' : 'Skip guide'}</button><button className="button primary" onClick={step === guide.length - 1 ? finish : next}>{step === guide.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} /></button></div><button className="guide-shortcut" onClick={() => open(item.destination)}>{item.action} <ArrowRight size={15} /></button></div></div>
}
function HomePage({ child, catalog, todayMeals, dailyProtein, groups, navigate, openFood, removeMeal }: { child: Child; catalog: Food[]; todayMeals: Meal[]; dailyProtein: number; groups: number; navigate: (p: Page) => void; openFood: (f: Food) => void; removeMeal: (id: string) => void }) {
  return <>
    <div className="welcome-line"><span className="eyebrow">A GOOD PLACE TO BEGIN</span><span className="date-text">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span></div>
    <div className="hero"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> For every little step</span><h1>Growing well starts<br />with <em>curiosity.</em></h1><p>Understand what’s on their plate, find answers to your questions, and feel less alone along the way.</p><button className="button white" onClick={() => navigate('explore')}>Explore foods <ArrowRight size={18} /></button></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="food-float float-one">🥦</div><div className="food-float float-two">🐟</div><div className="food-float float-three">🥕</div><div className="hero-bowl"><span>🥑</span><span>🥬</span><span>🍅</span><span>🥕</span></div><div className="hero-sparkle a">✦</div><div className="hero-sparkle b">✳</div></div></div>
    <div className="intro-heading"><div><span className="eyebrow">MADE FOR REAL LIFE</span><h2>What would you like to do today?</h2></div><p>Take one small step at a time.</p></div>
    <div className="action-grid"><button className="action-card" onClick={() => navigate('label')}><span className="action-icon lavender"><ScanLine size={26} /></span><span className="action-title">Check a food photo <ArrowRight size={17} /></span><span className="action-description">Photograph a meal for nutrient clues, or check a package label.</span><span className="action-bottom">PHOTO OR LABEL</span></button><button className="action-card" onClick={() => navigate('explore')}><span className="action-icon peach"><Leaf size={26} /></span><span className="action-title">Explore fresh foods <ArrowRight size={17} /></span><span className="action-description">See what an amount of salmon, tofu or other foods contains.</span><span className="action-bottom">EXPLORE FOODS</span></button><button className="action-card" onClick={() => navigate('ask')}><span className="action-icon mint"><MessageCircle size={26} /></span><span className="action-title">Ask a question <ArrowRight size={17} /></span><span className="action-description">Get a calm starting point for your food questions.</span><span className="action-bottom">ASK NOURI</span></button></div>
    <div className="dashboard-grid"><section className="panel day-panel"><div className="panel-heading"><div><span className="eyebrow">A SIMPLE PICTURE</span><h2>{child.name}'s food today</h2></div><button className="text-button" onClick={() => navigate('explore')}>Add food <Plus size={17} /></button></div>{todayMeals.length ? <><div className="stats-row"><div><strong>{todayMeals.length}</strong><span>foods logged</span></div><div><strong>{groups}</strong><span>food groups</span></div><div><strong>{dailyProtein.toFixed(1)}<small> g</small></strong><span>protein estimate</span></div></div><div className="meal-list">{todayMeals.slice(0, 4).map(m => { const food = m.foodSnapshot || catalog.find(f => f.id === m.foodId); if (!food) return null; return <div className="meal-row" key={m.id}><span className={`meal-emoji ${food.color}`}>{food.emoji}</span><div><strong>{food.name}</strong><small>{m.meal} · {m.grams} g · ~{proteinFor(food, m.grams).toFixed(1)} g protein</small></div><button className="icon-button subtle" aria-label={`Remove ${food.name}`} onClick={() => removeMeal(m.id)}><Trash2 size={16} /></button></div> })}</div></> : <div className="empty-state"><span>🥣</span><strong>A blank page is a fine start.</strong><p>Add a food to see a gentle overview of the day.</p><button className="button secondary" onClick={() => navigate('explore')}>Find a food <ArrowRight size={16} /></button></div>}<p className="panel-footnote">A meal log gives context. It cannot measure whether a child’s personal needs are met.</p></section><section className="panel discover-panel"><div className="panel-heading"><div><span className="eyebrow">A LITTLE INSPIRATION</span><h2>Explore a food</h2></div></div><div className="featured-food"><div className="featured-visual">🐟<span className="featured-leaf">✦</span></div><div><span className="mini-tag">FRESH FOOD</span><h3>Salmon, cooked</h3><p>Curious how much protein is in a small portion?</p><button className="text-button" onClick={() => openFood(foods[0])}>Look closer <ArrowRight size={17} /></button></div></div><div className="discover-bottom"><span className="tiny-avatars">👩🏽 👩🏻 👨🏾</span><span>There’s room for your questions in the circle.</span><button onClick={() => navigate('circle')} aria-label="Open parent circle"><ArrowRight size={17} /></button></div></section></div>
  </>
}
function ExplorePage({ child, catalog, customFoods, changeCustomFoods, openFood }: { child: Child; catalog: Food[]; customFoods: Food[]; changeCustomFoods: (foods: Food[]) => void; openFood: (f: Food) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [editingFood, setEditingFood] = useState<Food | 'new' | null>(null)
  const filtered = catalog.filter(f => (filter === 'All' || (filter === 'My foods' ? f.local : f.category === filter)) && f.name.toLowerCase().includes(query.toLowerCase()))
  function saveFood(food: Food) {
    changeCustomFoods(editingFood === 'new' ? [...customFoods, food] : customFoods.map(f => f.id === food.id ? food : f))
    setEditingFood(null); setFilter('My foods'); setQuery('')
  }
  return <>
    <SectionHeading eyebrow="EXPLORE FOODS" title="Get to know their food." description="Pick a food, choose an amount, and see a simple protein estimate. Add foods from your own kitchen too." action={<button className="button primary" onClick={() => setEditingFood('new')}><Plus size={17} /> Add my food</button>} />
    <div className="explore-banner"><span className="banner-icon"><ShieldCheck size={22} /></span><div><strong>Personal context, without a verdict</strong><p>{child.name} is {child.age} months old{child.allergies.length ? `, with ${child.allergies.join(', ')} saved as ${child.allergies.length === 1 ? 'an allergy' : 'allergies'}` : ''}. We highlight saved allergens, but you should always verify food and preparation yourself.</p></div></div>
    <div className="food-tools"><label className="search-box"><Search size={19} /><input placeholder="Search foods, like salmon or oats" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="filter-row">{['All', 'Protein', 'Fruit & veg', 'Grains', 'Dairy & alternatives', 'My foods'].map(c => <button className={`filter-chip ${filter === c ? 'active' : ''}`} key={c} onClick={() => setFilter(c)}>{c}</button>)}</div></div>
    <div className="food-grid">{filtered.map(food => <div className="food-tile" key={food.id}><button className="food-card" onClick={() => openFood(food)}><div className={`food-visual ${food.color}`}><span>{food.emoji}</span></div><div className="food-card-copy"><span className="mini-tag">{food.local ? 'SAVED BY YOU · ' : ''}{food.category.toUpperCase()}</span><h3>{food.name}</h3><p>{food.note}</p><span className="food-card-bottom">Explore portions <ArrowRight size={16} /></span></div></button>{food.local && <div className="my-food-actions"><button onClick={() => setEditingFood(food)}>Edit</button><button onClick={() => changeCustomFoods(customFoods.filter(f => f.id !== food.id))}>Remove</button></div>}</div>)}</div>
    {!filtered.length && <div className="no-results">{filter === 'My foods' && !customFoods.length ? <>No saved foods yet. <button className="text-button" onClick={() => setEditingFood('new')}>Add your first food <Plus size={16} /></button></> : 'No foods matched. Try another search.'}</div>}
    <div className="learn-note"><CircleHelp size={20} /><p>Built-in protein values are rounded examples per 100 g. Foods you add use the values you enter and stay in this browser only. Neither is a daily target or a safety check.</p></div>
    {editingFood && <CustomFoodForm initial={editingFood === 'new' ? null : editingFood} onClose={() => setEditingFood(null)} onSave={saveFood} />}
  </>
}
const foodCategories: Food['category'][] = ['Protein', 'Fruit & veg', 'Grains', 'Dairy & alternatives']
const foodIcons: Record<Food['category'], string> = { Protein: '🍲', 'Fruit & veg': '🥕', Grains: '🌾', 'Dairy & alternatives': '🥣' }
const foodColors: Record<Food['category'], string> = { Protein: 'peach', 'Fruit & veg': 'mint', Grains: 'butter', 'Dairy & alternatives': 'lilac' }
function CustomFoodForm({ initial, onClose, onSave }: { initial: Food | null; onClose: () => void; onSave: (food: Food) => void }) {
  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState<Food['category']>(initial?.category || 'Protein')
  const [protein, setProtein] = useState(initial ? String(initial.protein) : '')
  const [note, setNote] = useState(initial?.note || '')
  const [tip, setTip] = useState(initial?.tip || '')
  const [allergens, setAllergens] = useState<string[]>(initial?.allergens || [])
  function submit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(protein)
    if (!name.trim() || !Number.isFinite(amount) || amount < 0 || amount > 100) return
    onSave({ id: initial?.id || `my-${crypto.randomUUID()}`, name: name.trim(), category, protein: amount, note: note.trim() || 'Food saved by you', tip: tip.trim() || 'Check the original food or package and prepare it for your child’s age.', allergens, emoji: foodIcons[category], color: foodColors[category], local: true })
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal custom-food-modal" role="dialog" aria-modal="true" aria-label={initial ? 'Edit my food' : 'Add my food'} onMouseDown={e => e.stopPropagation()} onSubmit={submit}><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button><span className="eyebrow">MY FOODS · SAVED ON THIS DEVICE</span><h2>{initial ? 'Edit your food' : 'Add a food you know'}</h2><p>Use a reliable package or food data source for values. Entries are private to this browser and are not verified by NouriCircle.</p><label className="form-label">Food name<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Homemade lentil soup" /></label><label className="form-label">Food group<select value={category} onChange={e => setCategory(e.target.value as Food['category'])}>{foodCategories.map(c => <option key={c}>{c}</option>)}</select></label><label className="form-label">Protein per 100 g <small>Enter grams of protein for 100 g of the food, not for one serving.</small><input type="number" required min="0" max="100" step="0.1" value={protein} onChange={e => setProtein(e.target.value)} placeholder="e.g. 9" /></label><label className="form-label">Short nutrition note <small>Optional, write what you know about this food.</small><input maxLength={120} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Protein and fiber" /></label><label className="form-label">Preparation or label note <small>Optional, remind yourself how to serve or check it.</small><textarea rows={3} maxLength={250} value={tip} onChange={e => setTip(e.target.value)} placeholder="e.g. Serve soft and check the package" /></label><div className="form-label">Allergens you know are in this food <small>Leave empty if unknown. An empty list does not mean allergen free.</small></div><div className="chip-grid">{allergenOptions.map(a => <button type="button" key={a} className={`choice-chip ${allergens.includes(a) ? 'selected' : ''}`} onClick={() => setAllergens(allergens.includes(a) ? allergens.filter(x => x !== a) : [...allergens, a])}>{allergens.includes(a) && <Check size={14} />}{a}</button>)}</div><button className="button primary full" type="submit">{initial ? 'Save changes' : 'Save my food'} <ArrowRight size={17} /></button></form></div>
}
function FoodModal({ food, child, onClose, onAdd }: { food: Food; child: Child; onClose: () => void; onAdd: (grams: number, meal: string) => void }) {
  const [grams, setGrams] = useState(30)
  const [meal, setMeal] = useState('Lunch')
  const allergyMatch = food.allergens.filter(a => child.allergies.includes(a))
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal food-modal" role="dialog" aria-modal="true" aria-label={food.name} onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button><div className={`food-modal-art ${food.color}`}>{food.emoji}</div><span className="eyebrow">{food.local ? "YOUR SAVED FOOD" : "FOOD EXPLORER"}</span><h2>{food.name}</h2><p>{food.note}. This is a simple estimate for a food amount you choose, not a recommended serving.</p>{allergyMatch.length > 0 && <div className="alert warning"><ShieldCheck size={18} /><span>Saved allergy match: {allergyMatch.join(', ')}. Check with your child's clinician before serving.</span></div>}{food.allergens.length > 0 && !allergyMatch.length && <div className="allergen-inline">{food.local ? "Allergens you entered" : "Common allergen"}: <strong>{food.allergens.join(', ')}</strong></div>}<div className="portion-control"><div><label htmlFor="grams">Amount to explore</label><small>Enter the amount of prepared food in grams.</small></div><div className="grams-input"><input id="grams" type="number" min="1" max="1000" value={grams} onChange={e => setGrams(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} /><span>g</span></div></div><div className="portion-result"><span>Estimated protein in this amount</span><strong>{proteinFor(food, grams).toFixed(1)} <small>g</small></strong><p>{food.local ? "Based on the value you entered" : "Based on a rounded example"}: {food.protein} g per 100 g. This does not show how much of a daily need is met.</p></div><div className="food-tip"><Leaf size={18} /><span>{food.tip} {food.local ? "This entry is not checked against a nutrition database or allergen record." : ""}</span></div><label className="form-label">Add to today's meal log<select value={meal} onChange={e => setMeal(e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label><button className="button primary full" onClick={() => onAdd(grams, meal)}><Plus size={18} /> Add to meal log</button></div></div>
}
function FoodPhotoPanel() {
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<PhotoAnalysis | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function choose(selected: File | undefined) {
    if (!selected) return
    if (!selected.type.startsWith('image/')) { setError('Choose a food image.'); return }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setResult(null)
    setError('')
  }
  async function takePhoto() {
    if (!Capacitor.isNativePlatform()) { cameraInput.current?.click(); return }
    try {
      const photo = await NativeCamera.getPhoto({ quality: 75, resultType: CameraResultType.Uri, source: CameraSource.Camera, correctOrientation: true })
      if (!photo.webPath) throw new Error('The camera did not return a photo.')
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      choose(new File([blob], 'meal.jpg', { type: blob.type || 'image/jpeg' }))
    } catch (err) {
      if (err instanceof Error && /cancel/i.test(err.message)) return
      setError(err instanceof Error ? err.message : 'Could not open the camera. Choose an image instead.')
    }
  }
  async function analyze() {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try { setResult(await analyzeFoodPhoto(file)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not analyze this photo.') }
    finally { setBusy(false) }
  }
  return <section className="panel meal-photo-panel" aria-label="Analyze a meal photo">
    <div className="step-number">01 <span>PHOTO OF FOOD OR A MEAL</span></div>
    <h2>What might be on this plate?</h2>
    <p>Take a picture of fresh food or a prepared meal. Nouri can point out likely foods and the nutrients they may provide.</p>
    <div className="meal-photo-grid">
      <div>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" className="button primary full" onClick={() => void takePhoto()} disabled={busy}><Camera size={18} /> Take a food photo</button>
        <button type="button" className="upload-zone meal-upload" onClick={() => fileInput.current?.click()} disabled={busy}>
          {preview ? <img src={preview} alt="Food photo selected for analysis" /> : <><UploadCloud size={30} /><strong>Choose a food photo</strong><small>Use an existing image on your device</small></>}
        </button>
        <button type="button" className="button secondary full" disabled={!file || busy} onClick={() => void analyze()}>{busy ? 'Analyzing photo...' : 'Analyze this food photo'} <Sparkles size={17} /></button>
        <p className="upload-note">Your photo is sent to Google Gemini through NouriCircle when you tap Analyze. It is not saved to your meal log. No child profile is sent.</p>
      </div>
      <div className="meal-photo-result" aria-live="polite">
        {error && <div className="alert warning" role="alert">{error}</div>}
        {busy && <div className="processing"><span className="spinner" /> Looking at the food in your photo...</div>}
        {result ? <>
          <span className="mini-tag">PHOTO GUIDE · GENERAL NUTRITION</span>
          <h3>{result.summary}</h3>
          {result.foods.length > 0 && <><strong>Foods and likely nutrients</strong><ul>{result.foods.map((food, i) => <li key={i}><b>{food.name}:</b> {food.nutrients}</li>)}</ul></>}
          {result.possibleAllergens.length > 0 && <div className="alert warning"><ShieldCheck size={18} /><span>Possible allergens to check: {result.possibleAllergens.join(', ')}. Check the real ingredients and your care plan.</span></div>}
          {result.uncertainties.length > 0 && <><strong>What the photo cannot show</strong><ul>{result.uncertainties.map((note, i) => <li key={i}>{note}</li>)}</ul></>}
          {result.nextStep && <p>{result.nextStep}</p>}
          <small>A photo cannot measure grams, exact nutrients, hidden ingredients, or whether your child has met daily needs.</small>
        </> : !busy && !error && <div className="result-placeholder"><div className="placeholder-art"><Camera size={42} /></div><h2>Your food photo notes will appear here.</h2><p>For exact amounts, weigh the food and use Explore foods or its package label.</p></div>}
      </div>
    </div>
  </section>
}
function LabelPage({ child }: { child: Child }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [lookupMessage, setLookupMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookupBusy, setLookupBusy] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState(false)
  const analysis = analyzeLabel(label, child.allergies)
  const productAllergens = product ? [...product.allergens, ...product.traces] : []
  const savedProductMatches = child.allergies.filter(a => productAllergens.some(term => term.toLowerCase() === a.toLowerCase()))
  async function lookUp(e: FormEvent) {
    e.preventDefault()
    setLookupBusy(true); setLookupMessage(''); setProduct(null); setChecked(false)
    try {
      const found = await lookupProduct(barcode)
      if (!found) { setLookupMessage('No product found for that barcode. Try the label photo or paste the text below.'); return }
      setProduct(found)
      setLabel(found.ingredients ? `Ingredients: ${found.ingredients}` : '')
      setChecked(Boolean(found.ingredients))
      if (!found.ingredients) setLookupMessage('Product found, but its ingredient list is missing. Check the package or add a label photo.')
    } catch (e) { setLookupMessage(e instanceof Error ? e.message : 'Lookup failed. Try again or use a label photo.') }
    finally { setLookupBusy(false) }
  }
  async function takePhoto() {
    if (!Capacitor.isNativePlatform()) { cameraInputRef.current?.click(); return }
    try {
      const photo = await NativeCamera.getPhoto({ quality: 85, resultType: CameraResultType.Uri, source: CameraSource.Camera, correctOrientation: true })
      if (!photo.webPath) throw new Error('The camera did not return a photo.')
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      await readPhoto(new File([blob], 'food-label.jpg', { type: blob.type || 'image/jpeg' }))
    } catch (err) {
      // Closing the camera is an ordinary cancellation.
      if (err instanceof Error && /cancel/i.test(err.message)) return
      setError(err instanceof Error ? err.message : 'Could not open the camera. Choose an image instead.')
    }
  }
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await readPhoto(file)
    e.target.value = ''
  }
  async function readPhoto(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (image) URL.revokeObjectURL(image)
    setImage(URL.createObjectURL(file)); setBusy(true); setChecked(false); setError(''); setProduct(null); setLookupMessage('')
    let worker: Awaited<ReturnType<typeof createWorker>> | undefined
    try { worker = await createWorker('eng'); const result = await worker.recognize(file); setLabel(result.data.text.trim()); if (!result.data.text.trim()) setError('No text was found. Try a sharper, well lit photo or paste the label text below.') }
    catch { setError('Photo text could not be read. Paste the label text below instead.') }
    finally { if (worker) await worker.terminate(); setBusy(false) }
  }
  return <>
    <SectionHeading eyebrow="CHECK FOOD" title="Look closer at food and labels." description="Take a meal photo for general nutrition clues, or check a packaged food by barcode or label. A photo cannot measure exact nutrients or guarantee safety." />
    <FoodPhotoPanel />
    <div className="label-layout"><section className="panel label-input-panel">
      <div className="step-number">02 <span>CHECK A PACKAGED FOOD</span></div>
      <form className="barcode-form" onSubmit={lookUp}><label htmlFor="barcode">Barcode number</label><div><input id="barcode" inputMode="numeric" pattern="[0-9]{8,14}" minLength={8} maxLength={14} value={barcode} onChange={e => setBarcode(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 3017620422003" /><button className="button primary" disabled={lookupBusy || !barcode}>{lookupBusy ? 'Looking up...' : 'Look up'} <Search size={16} /></button></div><small>Type the digits beneath the barcode. Results come from Open Food Facts.</small></form>
      {lookupMessage && <div className="alert warning" role="status">{lookupMessage}</div>}
      <div className="input-divider">or use a photo</div>
      <input ref={inputRef} type="file" accept="image/*" onChange={upload} hidden />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={upload} hidden />
      <button className="button primary full camera-action" onClick={() => void takePhoto()} disabled={busy}><Camera size={19} /> Take a label photo</button>
      <button className={`upload-zone ${image ? 'has-image' : ''}`} onClick={() => inputRef.current?.click()}>{image ? <img src={image} alt="Uploaded food label" /> : <><span className="upload-icon"><UploadCloud size={31} /></span><strong>Add a food label photo</strong><small>Choose an existing image from your phone</small><span className="upload-button">Choose an image <ArrowRight size={16} /></span></>}</button>
      <p className="upload-note"><Camera size={15} /> A clear photo of the ingredients and nutrition panel works best.</p>
      {busy && <div className="processing"><span className="spinner" /> Reading text from your image. This can take a moment...</div>}
      {error && <div className="alert warning">{error}</div>}
      <label className="form-label label-editor">Ingredient or label text <small>Check and correct the extracted words before reviewing.</small><textarea rows={7} placeholder={'Ingredients: oats, milk, sugar...\nProtein 4 g, Sugars 6 g, Sodium 90 mg'} value={label} onChange={e => { setLabel(e.target.value); setChecked(false); setProduct(null) }} /></label>
      <button className="button primary full" disabled={!label.trim() || busy} onClick={() => setChecked(true)}>Review this text <ArrowRight size={17} /></button>
    </section><section className="panel label-result-panel"><div className="step-number">03 <span>UNDERSTAND WHAT YOU SEE</span></div>
      {product && <div className="product-result"><span className="mini-tag">OPEN FOOD FACTS · LIVE LOOKUP</span><h2>{product.name}</h2><p>{product.brand || 'Brand not listed'} · Barcode {product.barcode}</p><a href={product.url} target="_blank" rel="noopener noreferrer">View source record <ArrowRight size={14} /></a><div className="result-list"><div><span>Serving size</span><strong>{product.serving || 'Not listed'}</strong></div><div><span>Protein per 100 g</span><strong>{product.protein === null ? 'Not listed' : `${product.protein} g`}</strong></div><div><span>Sugars per 100 g</span><strong>{product.sugars === null ? 'Not listed' : `${product.sugars} g`}</strong></div><div><span>Sodium per 100 g</span><strong>{product.sodium === null ? 'Not listed' : `${Math.round(product.sodium * 1000)} mg`}</strong></div><div><span>Listed allergens</span><strong>{product.allergens.length ? product.allergens.join(', ') : 'Not listed in database'}</strong></div><div><span>Possible traces</span><strong>{product.traces.length ? product.traces.join(', ') : 'Not listed in database'}</strong></div></div>{savedProductMatches.length > 0 && <div className="alert warning"><ShieldCheck size={18} /><span>Saved allergy appears in database allergens or possible traces: {savedProductMatches.join(', ')}. Check the package and care plan.</span></div>}</div>}
      {checked ? <><h2>Ingredient notes</h2><p className="muted">A starting point, never a food safety verdict.</p>{analysis.matches.length > 0 ? <div className="alert warning"><ShieldCheck size={20} /><div><strong>Saved allergy term found</strong><span>{analysis.matches.join(', ')} appears in the text. Check the full package and care plan.</span></div></div> : <div className="alert neutral"><ShieldCheck size={20} /><div><strong>No saved allergy term found in this text</strong><span>This is not an allergy clearance. Records and photo reading can miss words.</span></div></div>}<div className="result-list"><div><span>Allergen words mentioned</span><strong>{analysis.mentioned.length ? analysis.mentioned.join(', ') : 'None detected in this text'}</strong></div>{!product && <><div><span>Protein in text</span><strong>{analysis.protein === null ? 'Not found' : `${analysis.protein} g (serving unclear)`}</strong></div><div><span>Sugar in text</span><strong>{analysis.sugar === null ? 'Not found' : `${analysis.sugar} g (serving unclear)`}</strong></div><div><span>Sodium in text</span><strong>{analysis.sodium === null ? 'Not found' : `${analysis.sodium} mg (serving unclear)`}</strong></div></>}<div><span>Ingredient terms to look up</span><strong>{analysis.additives.length ? analysis.additives.join(', ') : 'None from the short example list'}</strong></div></div><div className="result-reminder"><CircleHelp size={18} /><span>An additive name alone does not show harm. Check serving size, age appropriate preparation, and the original label.</span></div></> : !product && <div className="result-placeholder"><div className="placeholder-art"><ScanLine size={45} /><span>✦</span></div><h2>Your food notes will appear here.</h2><p>Look up a barcode or review the text from a label photo.</p><div className="placeholder-line" /><div className="placeholder-line short" /><div className="placeholder-line medium" /></div>}
    </section></div><div className="learn-note"><ShieldCheck size={20} /><p>Open Food Facts is community supplied and may be incomplete. Package labels can change. Always check the product in your hand, especially for allergies.</p></div>
  </>
}
function AskPage({ child, meals, catalog, navigate }: { child: Child; meals: Meal[]; catalog: Food[]; navigate: (p: Page) => void }) {
  type Chat = { who: 'you' | 'nouri'; text: string; title?: string; source?: { label: string; url: string } }
  const [messages, setMessages] = useState<Chat[]>([])
  const [question, setQuestion] = useState('')
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void loadAskEndpoint().then(setEndpoint) }, [])
  async function ask(value: string) {
    const trimmed = value.trim()
    if (!trimmed || busy || endpoint === null) return
    const earlier = messages.filter(m => m.title !== 'Live answer unavailable').map((m): ChatTurn => ({ role: m.who === 'you' ? 'user' : 'model', text: m.text }))
    setMessages(prev => [...prev, { who: 'you', text: trimmed }]); setQuestion('')
    if (!endpoint) {
      const response = answerQuestion(trimmed, child.age, child.allergies, meals, catalog)
      setMessages(prev => [...prev, { who: 'nouri', text: response.body, title: response.title, source: response.source }])
      return
    }
    setBusy(true)
    try {
      const answer = await askLive(endpoint, trimmed, earlier, catalog)
      setMessages(prev => [...prev, { who: 'nouri', text: answer, title: 'Live AI answer' }])
    } catch (error) {
      setMessages(prev => [...prev, { who: 'nouri', text: error instanceof Error ? error.message : 'Please try again later.', title: 'Live answer unavailable' }])
    } finally { setBusy(false) }
  }
  return <>
    <SectionHeading eyebrow="ASK NOURI" title="Questions are welcome here." description={endpoint ? 'Ask about food, ingredients, or feeding. Live AI answers are general guidance, not a nutrition or medical verdict.' : 'Explore common nutrition and feeding questions with prepared guidance and links to read.'} />
    <div className="ask-layout"><section className="panel chat-panel"><div className="chat-header"><div className="assistant-avatar"><Sparkles size={23} /></div><div><strong>Nouri guide</strong><span>{endpoint === null ? 'Checking connection...' : endpoint ? 'Live AI · Gemini Flash-Lite' : 'Prepared guidance · live AI not connected'}</span></div><span className="online-dot" /></div>
      <div className="chat-body"><div className="chat-message nouri"><span className="small-avatar"><Leaf size={17} /></span><div className="chat-bubble"><strong>Hi, I'm here to help you explore.</strong><p>Ask about a food, an ingredient, a portion, or a mealtime worry. {endpoint ? 'Your question is sent to the Gemini service through NouriCircle’s secure endpoint.' : 'This version will share a prepared starting point and a source to check.'}</p></div></div>{messages.map((m, i) => <div className={`chat-message ${m.who}`} key={i}>{m.who === 'nouri' && <span className="small-avatar"><Leaf size={17} /></span>}<div className="chat-bubble">{m.title && <strong>{m.title}</strong>}<p>{m.text}</p>{m.source && <a href={m.source.url} target="_blank" rel="noopener noreferrer">Read the source: {m.source.label} <ArrowRight size={14} /></a>}</div></div>)}{busy && <div className="chat-message nouri"><span className="small-avatar"><Leaf size={17} /></span><div className="chat-bubble">Nouri is thinking...</div></div>}</div>
      <form className="chat-form" onSubmit={(e: FormEvent) => { e.preventDefault(); void ask(question) }}><input aria-label="Ask a nutrition question" maxLength={600} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about food or feeding..." /><button disabled={!question.trim() || busy || endpoint === null} aria-label="Send question"><Send size={19} /></button></form></section>
      <aside className="ask-side"><div className="panel suggested-panel"><span className="eyebrow">NOT SURE WHERE TO START?</span><h2>Try asking...</h2>{['How much protein is in salmon?', 'What does this ingredient mean?', 'My child is picky about textures', 'How do I check an allergy label?'].map(q => <button key={q} disabled={busy || endpoint === null} onClick={() => void ask(q)}>{q}<ArrowRight size={16} /></button>)}</div><div className="side-care"><div className="care-icon">💜</div><h3>You're doing a lot.</h3><p>For personal medical concerns, a clinician who knows your child is the best person to ask. Want to hear from other parents too?</p><button onClick={() => navigate('circle')}>Visit the parent circle <ArrowRight size={16} /></button></div></aside></div>
    <div className="learn-note"><BookOpen size={20} /><p>{endpoint ? 'Live questions and recent chat text are sent to Google Gemini. Do not include your child’s name or private health details. Answers may be wrong; check labels and trusted sources. No child profile or meal log is sent automatically.' : 'Live AI is not connected yet. Replies here are prepared, keyword matched examples. They do not diagnose or set daily requirements.'}</p></div>
  </>
}
function CirclePage({ posts, changePosts }: { posts: Post[]; changePosts: (posts: Post[]) => void }) {
  const [category, setCategory] = useState('All')
  const [composer, setComposer] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [postCategory, setPostCategory] = useState('First foods')
  const [openPost, setOpenPost] = useState<Post | null>(null)
  const [reply, setReply] = useState('')
  const all = [...posts, ...samplePosts.filter(sample => !posts.some(post => post.id === sample.id))]
  const visible = all.filter(p => category === 'All' || p.category === category)
  function submitPost(e: FormEvent) { e.preventDefault(); if (!title.trim() || !body.trim()) return; const post: Post = { id: crypto.randomUUID(), category: postCategory, title: title.trim(), body: body.trim(), author: 'You', time: 'Saved on this device', replies: [], local: true }; changePosts([post, ...posts]); setTitle(''); setBody(''); setComposer(false); setCategory('All') }
  function addReply(e: FormEvent) { e.preventDefault(); if (!reply.trim() || !openPost) return; if (openPost.local) { const next = posts.map(p => p.id === openPost.id ? { ...p, replies: [...p.replies, reply.trim()] } : p); changePosts(next); setOpenPost(next.find(p => p.id === openPost.id)!) } else { const copy: Post = { ...openPost, replies: [...openPost.replies, reply.trim()], local: true }; changePosts([copy, ...posts.filter(p => p.id !== copy.id)]); setOpenPost(copy) } setReply('') }
  return <><SectionHeading eyebrow="PARENT CIRCLE" title="A little less alone, together." description="A space to share the questions and small wins that come with raising a child." action={<button className="button primary" onClick={() => setComposer(true)}><Plus size={18} /> Start a discussion</button>} /><div className="circle-banner"><div className="circle-avatars">👩🏻‍🦰 👨🏽 👩🏾 👩🏻</div><div><strong>Every family’s story is different.</strong><span>Feeding, development, health questions, and your own wellbeing all have a place here.</span></div><Heart size={25} /></div><div className="community-note"><ShieldCheck size={18} /><span>This is a local forum demo. Your posts stay in this browser and are not sent to other parents. Live moderation is planned for a future version. For urgent health concerns, contact a healthcare professional.</span></div><div className="forum-layout"><div className="forum-main"><div className="forum-toolbar"><h2>Conversations <span>{visible.length}</span></h2><div className="filter-row">{categories.map(c => <button className={`filter-chip ${category === c ? 'active' : ''}`} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div></div><div className="post-list">{visible.map((post, i) => <button className="post-card" key={post.id} onClick={() => setOpenPost(post)}><div className={`post-avatar avatar-${i % 4}`}>{post.author === 'You' ? 'Y' : post.author[0]}</div><div className="post-content"><div className="post-meta"><span>{post.category}</span> · {post.author} · {post.time}</div><h3>{post.title}</h3><p>{post.body}</p><div className="post-footer"><span><MessageCircle size={15} /> {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</span><span>Read conversation <ArrowRight size={15} /></span></div></div></button>)}</div></div><aside className="circle-side"><div className="panel circle-side-card"><span className="eyebrow">IN THIS CIRCLE</span><h3>It's okay to ask.</h3><p>Share your experience kindly. Avoid posting identifying details or treating another parent's story as medical advice.</p><div className="circle-illustration">♡ <span>✦</span></div></div></aside></div>
    {composer && <div className="modal-backdrop" onMouseDown={() => setComposer(false)}><form className="modal compose-modal" onSubmit={submitPost} role="dialog" aria-modal="true" aria-label="Start a discussion" onMouseDown={e => e.stopPropagation()}><button type="button" className="icon-button modal-close" onClick={() => setComposer(false)} aria-label="Close"><X size={20} /></button><span className="eyebrow">START A DISCUSSION</span><h2>What's on your mind?</h2><p>This post stays on your device in the prototype.</p><label className="form-label">Topic<select value={postCategory} onChange={e => setPostCategory(e.target.value)}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label className="form-label">Title<input required minLength={4} maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your question a short title" /></label><label className="form-label">Your message<textarea required minLength={10} maxLength={1000} rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Share what you're wondering about..." /></label><button className="button primary full" type="submit">Post locally <ArrowRight size={17} /></button></form></div>}
    {openPost && <div className="modal-backdrop" onMouseDown={() => setOpenPost(null)}><div className="modal post-modal" role="dialog" aria-modal="true" aria-label="Discussion" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={() => setOpenPost(null)} aria-label="Close"><X size={20} /></button><span className="mini-tag">{openPost.category.toUpperCase()}</span><h2>{openPost.title}</h2><div className="post-author">{openPost.author} · {openPost.time}</div><p className="post-full-body">{openPost.body}</p><div className="reply-heading">Replies ({openPost.replies.length})</div>{openPost.replies.map((r, i) => <div className="reply-card" key={i}><span className="reply-avatar">{i === openPost.replies.length - 1 && openPost.local ? 'Y' : 'P'}</span><p>{r}</p></div>)}<form className="reply-form" onSubmit={addReply}><input aria-label="Your reply" placeholder="Write a kind reply..." value={reply} onChange={e => setReply(e.target.value)} /><button disabled={!reply.trim()} aria-label="Send reply"><Send size={18} /></button></form></div></div>}
  </>
}
export default App
