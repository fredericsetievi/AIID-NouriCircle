# NouriCircle MVP

NouriCircle is an English-first web prototype for new parents and caregivers of babies starting solid foods and young children. It brings food exploration, a simple meal log, label reading, nutrition questions, and parent discussion into one calm interface. The visual direction follows the NouriCircle brochure: soft lavender, deep purple, rounded cards, and friendly food illustrations.

## Run it

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To check a production build, run `npm run build` and `npm run preview`.

## What works in this prototype

- **Child profile:** Set a nickname, age in months, and known allergies. The profile stays in browser local storage.
- **Fresh food explorer:** Search eight example foods, enter a portion in grams, see an approximate protein amount, and add it to today's meal log.
- **Meal log:** Review foods, groups, and an estimated protein total for the current day. Remove entries. The app does not claim a child has met a daily requirement.
- **Food label check:** Upload a photo for browser-side OCR, or paste label text. Review and correct the text, then highlight saved allergy terms, common allergen words, a few nutrition values, and selected ingredient terms. It does not rate a product as healthy or safe.
- **Ask Nouri:** Try common food and feeding questions. This version selects prepared responses and links to a source. It is not a live AI model.
- **Parent circle:** Browse sample discussions across first foods, development, health questions, and parent wellbeing. Create posts and replies stored only in this browser. This is not a live community and has no active moderation.

## Important limits

This is an educational prototype, not medical advice. Food values are rounded illustrative estimates per 100 g. Brands and preparation differ. OCR can miss or misread text. Check the original food package and your child's allergy care plan. Consult a clinician for individual nutrition, allergy, growth, or health questions. The prepared assistant should be replaced by a securely hosted service with reviewed sources before a public launch. Live accounts, moderation, data sync, and a verified nutrition database are future work.

No image, child profile, post, or meal is sent to a NouriCircle server. Profile, meal, and local forum data are stored in the current browser. OCR runs in the browser through Tesseract.js, which loads its worker and language assets on first use. Clear this site's browser storage to reset the demo.

## Sources used for the educational copy

- [CDC: Introducing solid foods](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html)
- [CDC: Foods and drinks to encourage](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-encourage.html)
- [CDC: Choking hazards](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html)
- [AAP: Picky eating](https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx)
- [USDA FoodData Central](https://fdc.nal.usda.gov/)

## Technical notes

React, TypeScript, Vite, Lucide icons, and Tesseract.js. There is no backend and no secret in the client. The Vite build uses relative asset paths so the static output can be hosted under a repository subpath.
