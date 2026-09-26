# NouriCircle MVP

NouriCircle is an English-first web prototype for new parents and caregivers of babies starting solid foods and young children. It brings food exploration, a simple meal log, label reading, nutrition questions, and parent discussion into one calm interface. The visual direction follows the NouriCircle brochure: soft lavender, deep purple, rounded cards, and friendly food illustrations.

## Run it

```bash
npm install
npm run dev
```

Open `/app.html` on the local URL printed by Vite. To check a production build, run `npm run build` and `npm run preview`. This repository's Pages setting currently serves `main` at the repository root. After editing source files, run `npm run sync-pages` and commit the updated `index.html` and `assets/` with the source. The GitHub Actions workflow also builds a `dist/` deployment for a future switch to Actions based Pages hosting.

## What works in this prototype

- **Child profile:** Set a nickname, age in months, and known allergies. The profile stays in browser local storage.
- **Food explorer:** Search 20 built-in example foods, enter a portion in grams, see an approximate protein amount, and add it to today's meal log.
- **My foods:** Add, edit, or remove your own food details including protein per 100 g, category, allergen notes, and a preparation reminder. Saved foods stay in this browser and can be added to the meal log. Logged meals retain their original food information if a saved food is later changed or removed.
- **Meal log:** Review foods, groups, and an estimated protein total for the current day. Remove entries. The app does not claim a child has met a daily requirement.
- **Food label check:** Upload a photo for browser-side OCR, or paste label text. Review and correct the text, then highlight saved allergy terms, common allergen words, a few nutrition values, and selected ingredient terms. It does not rate a product as healthy or safe.
- **Live packaged food lookup:** Enter the digits beneath a barcode to fetch the product name, ingredients, allergens, possible traces, and available per-100 g nutrient values from Open Food Facts. The original package remains the reference for allergy decisions. This free public service can be unavailable, limited, or missing products.
- **Getting started guide:** A four-step guide appears on the first visit and can be reopened from the help icon or side menu.
- **Ask Nouri:** The app can call a Gemini Flash-Lite Worker for live answers when the private service is configured. Without it, common questions show prepared responses and source links, clearly labeled as examples.
- **Parent circle:** Browse sample discussions across first foods, development, health questions, and parent wellbeing. Create posts and replies stored only in this browser. This is not a live community and has no active moderation.

## Important limits

This is an educational prototype, not medical advice. Food values are rounded illustrative estimates per 100 g. Brands and preparation differ. OCR can miss or misread text. Check the original food package and your child's allergy care plan. Consult a clinician for individual nutrition, allergy, growth, or health questions. Live AI answers can be inaccurate and do not include live source verification. Live accounts, moderation, data sync, and a verified nutrition database are future work.

No image, child profile, post, or meal log is sent to a NouriCircle server. A barcode lookup sends the barcode to Open Food Facts and receives a public product record. When live Ask Nouri is enabled, the question, recent chat, and any food estimate directly relevant to the question go through the Worker to Gemini. Profile, custom food, meal, and local forum data are stored in the current browser. This is not a synced account: another device or browser will not show the saved entries. OCR runs in the browser through Tesseract.js, which loads its worker and language assets on first use. Clear this site's browser storage to reset the demo.

## Sources used for the educational copy

- [CDC: Introducing solid foods](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html)
- [CDC: Foods and drinks to encourage](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-encourage.html)
- [CDC: Choking hazards](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html)
- [AAP: Picky eating](https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx)
- [USDA FoodData Central](https://fdc.nal.usda.gov/)
- [Open Food Facts API and reuse rules](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)

## Technical notes

React, TypeScript, Vite, Lucide icons, and Tesseract.js. There is no backend and no secret in the client. The Vite build uses relative asset paths so the static output can be hosted under a repository subpath.

The barcode lookup uses Open Food Facts' currently supported v2 product endpoint because it returns explicit per-100 g nutriment fields. New integrations should plan to migrate to v3. The public API asks applications to identify themselves with a custom User-Agent; browsers do not allow JavaScript to set that header. For a larger public release, route lookups through a small backend, identify the app, cache responses, and honor the API's rate limits and attribution requirements. The current direct browser lookup may be affected by cross-origin rules or API policy changes.

USDA FoodData Central is **not** connected in this static release. The fresh food examples remain educational prototype content.

## Activate live Ask Nouri

The static GitHub Pages site cannot protect an API key. The `worker/` directory contains a small Cloudflare Worker that calls Gemini 3.5 Flash-Lite on the server. Cloudflare Workers and Gemini both have free tiers, with quotas and eligibility that can change. You need a Cloudflare account and a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). Never put the key in a GitHub file, Pages variable, or browser input.

1. From the repository root, deploy the Worker with `npx wrangler deploy --config worker/wrangler.toml`. Sign in to your own Cloudflare account if prompted. Note the resulting `https://...workers.dev` URL.
2. Store the key as a Worker secret with `npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml`. Enter it at the secure CLI prompt, not in a command argument or GitHub commit.
3. Set `public/ask-config.json` to `{ "endpoint": "https://your-worker.workers.dev" }`, run `npm run sync-pages`, and commit and push `public/ask-config.json`, `ask-config.json`, and the built site files. The URL is public; it contains no key.
4. Open Ask Nouri. Its header should say “Live AI · Gemini Flash-Lite”. Ask a test question and verify an answer. If the request fails, the chat shows a visible error rather than calling a prepared answer “live”.

The Worker accepts browser requests only from `https://fredericsetievi.github.io`, limits input and output sizes, and does not receive the saved child profile or meal log. Its public endpoint can still consume quota if abused by a non-browser client, so add provider rate limits and monitoring before a larger public launch. Gemini's free tier may use submitted prompts to improve Google's products. Ask users not to include names or private health details. Questions and recent chat text are sent to Gemini only when the Worker is configured.
