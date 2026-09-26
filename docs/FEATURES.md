# NouriCircle MVP — features and problems addressed

NouriCircle helps parents and caregivers explore foods for babies starting solids and young children. It is an educational prototype. The same React app powers the website and the Android/iOS projects, with phone navigation and a camera action in the mobile app.

| Feature | What it does | Parent problem it addresses |
| --- | --- | --- |
| Getting started guide | Introduces the child profile, food explorer, label check, and questions in four steps; parents can reopen it from Help. | A new parent can start using the app without having to discover every screen alone. |
| Child profile | Saves a nickname, age in months, and confirmed allergies on the current device. | Keeps relevant context close to the food tools and helps parents remember the allergy terms they want to check. |
| Food explorer | Searches and filters 20 example foods by category, with preparation notes and illustrative protein values per 100 g. | Makes it quicker to compare familiar foods and find age-aware preparation reminders. |
| Portion estimate | Calculates approximate protein for an amount entered in grams and lets parents choose a meal. | Turns a per-100 g value into a more understandable portion estimate without claiming to set a daily target. |
| My foods | Lets parents add, edit, and remove their own foods, including a category, protein value, allergen notes, and preparation tip. | Covers foods and family recipes missing from the small built-in catalog. |
| Daily meal log | Records foods and portions, shows today's food count, food groups, and estimated protein, and lets parents remove an entry. | Gives a simple record of what was offered today without requiring a spreadsheet. |
| Barcode lookup | Looks up a typed 8–14 digit barcode in Open Food Facts and shows available ingredients, allergens, possible traces, and nutrients. | Helps parents find product information when small print is hard to navigate. |
| Label photo and text review | Accepts a label image, reads text with OCR, lets parents correct it, and highlights saved allergy terms and selected ingredient or nutrient words. On Android/iOS, the camera button can take the photo directly. | Makes a package's ingredient text easier to inspect while shopping or preparing food. |
| Ask Nouri | Shows prepared answers and source links for common questions. If a secure Worker endpoint is configured, it sends questions to Gemini for a live answer. | Offers a starting point when a parent has a feeding or ingredient question. |
| Parent circle prototype | Displays sample discussions by topic and allows local posts and replies on the same device. | Gives parents a way to explore shared experiences and draft their own thoughts. It is not a connected community yet. |
| Sources and safety notes | Links to the educational sources and explains limits around allergy checks, nutrient estimates, OCR, and AI answers. | Helps parents understand when to verify the package or seek individual clinical advice. |
| Phone layout and native camera | Uses bottom navigation on narrow screens; the packaged mobile app opens the device camera for a label photo. | Makes the core tasks easier to reach while holding a phone in a shop or kitchen. |

## Typical parent journey

1. Set a child nickname, age, and any confirmed allergies.
2. Search a food or save a food from home; open it to estimate a portion and log it.
3. For a packaged food, type its barcode or photograph its label, then review the text against the actual package.
4. Ask a question or read a sample parent discussion when more context would help.

## Current MVP limits

- Saved profiles, foods, meals, posts, and replies live only in the current browser or app installation. There are no accounts, backups, or cross-device sync.
- Built-in nutrient numbers are rounded examples; user-added numbers are supplied by the parent. The meal log cannot determine whether a child meets personal nutrition needs.
- OCR can miss or misread words. Open Food Facts is community supplied and may omit or contain outdated product details. A missing allergen match never means a food is safe; check the package and the child's care plan.
- A label photo reads printed text. The app does not identify an unlabelled meal from its appearance or infer its full nutrients from an image.
- The public configuration currently has no live Ask endpoint. Prepared guidance works; live Gemini answers require a separately deployed secure service and can still be wrong.
- Parent circle posts are local demonstration content, not visible to other families and not moderated.
- Android can produce a test APK through GitHub Actions. The iOS workflow produces a simulator build; a physical-iPhone IPA requires Apple signing and provisioning.

The app is for learning and organization, not diagnosis, allergy clearance, or medical advice.
