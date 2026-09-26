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
- **Ask Nouri:** Try common food and feeding questions. This version selects prepared responses and links to a source. It is not a live AI model.
- **Parent circle:** Browse sample discussions across first foods, development, health questions, and parent wellbeing. Create posts and replies stored only in this browser. This is not a live community and has no active moderation.

## Important limits

This is an educational prototype, not medical advice. Food values are rounded illustrative estimates per 100 g. Brands and preparation differ. OCR can miss or misread text. Check the original food package and your child's allergy care plan. Consult a clinician for individual nutrition, allergy, growth, or health questions. The prepared assistant should be replaced by a securely hosted service with reviewed sources before a public launch. Live accounts, moderation, data sync, and a verified nutrition database are future work.

No image, child profile, custom food, post, or meal is sent to a NouriCircle server. A barcode lookup sends the barcode to Open Food Facts and receives a public product record. Profile, custom food, meal, and local forum data are stored in the current browser. This is not a synced account: another device or browser will not show the saved entries. OCR runs in the browser through Tesseract.js, which loads its worker and language assets on first use. Clear this site's browser storage to reset the demo.

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

USDA FoodData Central and Gemini are **not** connected in this static release. Their keys must be kept on a backend rather than committed to GitHub Pages. The fresh food examples and prepared assistant responses remain educational prototype content.
