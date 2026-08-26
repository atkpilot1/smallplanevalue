# Nuxt rewrite plan

Replace the monolithic `server/assets/page.html` (served by `server/routes/index.get.ts`) with Nuxt Vue components that match the current UI. APIs, valuation engine, and Supabase stay as they are.

This is a **markup-faithful** rewrite, not a redesign. Components exist so the page is organized — they should emit the same DOM the HTML already has.

## Rules

- **Tests stay strong.** E2E may get locator tweaks if Vue forces them. Do not change what a test asserts or prove. Do not drop cases, loosen matchers, or stub `/api/*` in the browser.
- **Snapshots are the visual contract.** After the rewrite, run `npm run test:e2e:snapshots`. Divergences must be shown (expected / actual / diff) and should be tiny or none. Do not silently `--update-snapshots` to hide drift.
- **Match the backup.** Frozen copy: [`reference/page.html`](../reference/page.html). Keep that file untouched. Diff against it while porting markup, class names, ids, labels, and result HTML.
- **Keep locator anchors.** Roles, visible names, `for=` labels, tab ARIA, and these test ids: `pane-lookup`, `pane-val`, `pane-comps`, `pane-feedback`, `pane-checklist`, `pane-sold`, `lookup-result`, `valuation-result`, `comps-result`, `feedback-result`, `checklist-result`, `sold-result`, `sold-recent`, `engine-life`, `engine-tbo-note`. Snapshot regions: `nav`, `.hero`, `#why`, `#how-it-works`, `#tools`, `#aircraft-types`, `#app`, `.disclaimer`, `footer`.
- **Keep user-visible behavior.** `alert()` validation, `localStorage` keys (`spv_client_id`, `spv_sold`, `spv_feedback`, `spv_email`), `?n=` deep link, lookup → other-tab prefill, retract/twin checklist extras, engine-life TBO fetch, share copy/links.

## What the current page actually is

| Layer | Today | After |
|---|---|---|
| Document | Full HTML file + inline CSS/JS | Nuxt `app.vue` + `pages/index.vue` |
| `/` | `server/routes/index.get.ts` injects showcase cards into `page.html` | Vue SSR; delete or retire that route so it no longer shadows the page |
| Marketing | Static sections | One component per snapshot region |
| Tools | Six tab panes, one visible | Tab state in a composable; each pane a component |
| Results | `innerHTML` string builders | Vue templates that emit the **same** class/structure |
| Cross-tab state | `window._lastLookup`, `_engModel`, `_acType`, `_numEng` | `useAircraftContext()` |
| Showcase | Server string replace `<!--SHOWCASE_CARDS-->` | Same `PLANES` + `SHOWCASE_PERIOD` logic, rendered as Vue |

`app.vue` is currently an empty shell. There is no `pages/` or `components/` tree yet. Stay on the existing root-level Nuxt layout (`app.vue`, `pages/`, `components/`, `composables/`, `assets/`). Do not migrate into an `app/` source dir unless something forces it.

## CSS and head

Copy the `<style>` block from the backup **verbatim** into `assets/css/page.css`. Import it once from `app.vue` or `nuxt.config.ts`.

- Do not rewrite class names or convert to scoped/utility CSS.
- Avoid extra wrapper elements that change layout (flex/grid children, section padding).
- Vue `scoped` adds `data-v-*` attributes. That is usually pixel-neutral; prefer **unscoped** global CSS so computed styles stay identical.
- Move fonts, Tabler icons, title, and gtag into `nuxt.config` `app.head` / `useHead` so they match the backup `<head>`.

Nuxt will wrap the page in `#__nuxt`. That is the one structural change we cannot avoid. Visual snapshots of named regions should still match. The full-`body` ARIA snapshot may gain one generic container — call that out if it happens; do not use it as cover for other a11y drift.

## Component map

Rough tree. Names can shift; the **boundaries** should stay.

```
app.vue                         # NuxtPage, global CSS
pages/index.vue                 # page assembly + showcase data + ?n= deep link

components/
  layout/
    AppNav.vue                  # <nav>
    AppDisclaimer.vue           # .disclaimer
    AppFooter.vue               # <footer> + share hrefs
  marketing/
    HeroSection.vue             # .hero (copy + stats + CTAs)
    ShowcaseGrid.vue            # .showcase / .showcase-grid
    ShowcaseCard.vue            # .aircraft-card (one plane)
    WhySection.vue              # #why
    HowItWorksSection.vue       # #how-it-works
    ToolsSection.vue            # #tools (cards call switchTab)
    AircraftTypesSection.vue    # #aircraft-types
  tools/
    ToolsApp.vue                # #app heading + tablist + panes
    TabBar.vue                  # role="tablist"
    Spinner.vue                 # .spin / .spin-i (shared)
    lookup/
      LookupPane.vue
      LookupResult.vue
    valuation/
      ValuationPane.vue         # form orchestration + submit
      ListingPaste.vue
      IdentityFields.vue        # make/model/year/annual/engines/Cirrus
      EngineTimes.vue           # TBO, conversion, single vs twin
      EngineLifeBar.vue         # bars + #engine-tbo-note
      ConditionFields.vue       # condition, cosmetics, logs, damage
      AvionicsFields.vue        # panel select + comfort/safety checks
      AvionicsItemize.vue       # <details> catalog (data-driven)
      ValuationResult.vue
    comps/
      CompsPane.vue
      CompsResult.vue
    checklist/
      ChecklistPane.vue
      ChecklistResult.vue       # sections, pass/flag/fail, summary
    sold/
      SoldPane.vue
      SoldResult.vue
      SoldRecent.vue
    feedback/
      FeedbackPane.vue
      ShareBox.vue
      FeedbackResult.vue
```

### Why this split

**Marketing stays coarse.** Those sections are static. One file per snapshot region is enough. Do not explode “why” into `WhyCard.vue` unless the file gets noisy.

**Tools split on behavior, not on every input.** A `FormGroup.vue` wrapper would fight pixel-matching. Keep labels/inputs inline in the pane (or a section component) with the backup’s markup.

**Valuation is the only form that needs subcomponents.** It is ~300 lines of fields plus a huge avionics list plus two result renderers (engine life + appraisal). Split at the visual sections already in the HTML.

**Avionics itemize is data + one renderer.** Move the checkbox catalog (ids, labels, optional qty/size selects, submit names) into `data/avionicsCatalog.ts`. The template must still produce the same two-column `<details>` DOM and the same `id="av-*"`. Do not invent a different grouping.

**Results become templates, not `innerHTML`.** Port `renderLookup`, `renderVal`, `renderComps`, `renderChecklist` / `clUpdateStats`, sold thank-you / recent list, and feedback thank-you as Vue. Copy the generated markup from the backup — same classes, same inline styles, same wording.

**Checklist static sections** move to `data/checklistBase.ts` (Documents, Engine, … plus retract/twin extras). Keep the same retract/twin detection rules that the tests already lock.

## Composables and data

| Composable / module | Replaces | Notes |
|---|---|---|
| `useToolsTab()` | `switchTab` | `aria-selected`, `.active` on tab + pane; scroll `#app` into view; render recent sales when opening sold |
| `useAircraftContext()` | `window._lastLookup` and friends | Lookup success stores record; valuation/comps/checklist tabs prefill on activate (same as today’s tab `onclick`) |
| `useClientId()` | `getOrCreateClientId` | `localStorage.spv_client_id` |
| `useShare()` | `initShareLinks`, `copyShareBlurb` | Origin-based Facebook/X hrefs; clipboard + fallback |
| `useReveal()` | IntersectionObserver on `.reveal` | Same threshold; snapshots already force `.visible` |
| `useApi()` | `apiPost` | Same error shape (`statusMessage` / `message`) so UI failure copy stays |
| `useEngineTbo()` | `refreshEngineLife*` | `GET /api/engine-tbo`; single vs twin bars |
| `useSoldReports()` | `getSoldData` / `saveSoldData` | `spv_sold`; cap display at 10 |
| `useFeedback()` | `sendAppFeedback` | `spv_feedback` backup + `POST /api/feedback` |
| `useAnalytics()` | `trackEvent` / gtag | Same event names |
| `server/utils/showcase.ts` | `PLANES` + `pickPlanes` in `index.get.ts` | Keep `SHOWCASE_PERIOD` pin for snapshots |
| `data/avionicsCatalog.ts` | Hardcoded `av-*` list + `avIds` map | |
| `data/checklistBase.ts` | `base` array in `doChecklist` | |

Client-only bits (`localStorage`, `alert`, clipboard) stay in composables with the same keys and messages. Do not replace `alert()` with a custom modal — tests use `page.waitForEvent('dialog')`.

## Cutover

1. **Backup** — already at `reference/page.html`. Do not edit it.
2. **Extract CSS + head** into Nuxt without switching `/` yet, or switch `/` as soon as `pages/index.vue` can render the marketing chrome. `server/routes/index.get.ts` **must** go (or stop handling `/`) or Nuxt never serves the Vue page.
3. **Implement in phases**, run the matching snapshots after each phase, fix markup against the backup before moving on.

### Phase 1 — Shell + marketing

`AppNav`, `HeroSection` + showcase, `WhySection`, `HowItWorksSection`, `ToolsSection`, `AircraftTypesSection`, `AppDisclaimer`, `AppFooter`.

Prove: `snapshots` → “marketing chrome”. Tools cards may no-op `switchTab` until phase 2.

### Phase 2 — Tab shell + empty panes

`ToolsApp` + `TabBar` + six pane components with **empty-state markup only** (forms, no results).

Prove: empty pane visual + ARIA snapshots; `app.spec` tab names; valuation twin / Cirrus / avionics-open snapshots.

### Phase 3 — Lookup

`POST /api/faa-lookup`, result card, example chips, `?n=` deep link, context store for later prefills.

Prove: `lookup.spec.ts` + lookup result snapshots.

### Phase 4 — Valuation

Parse listing, engine life, avionics collect-and-submit (same `avIds` strings), `POST /api/valuate`, result + accuracy buttons, partner tip on the spinner.

Prove: `valuate.spec.ts` + engine-life / valuation-result snapshots.

### Phase 5 — Comps, checklist, sold, feedback, share

Same APIs and localStorage behavior as today.

Prove: remaining spec files + those result snapshots.

### Phase 6 — Cross-cutting + cleanup

Prefill from lookup, share links in footer + feedback, scroll-reveal, gtag. Delete `server/assets/page.html` and `server/routes/index.get.ts` once Vue owns `/`. Leave `reference/page.html` in place.

Prove: **full** `npm run test:e2e` (not only `@snapshot`).

## Snapshot and review workflow

After each phase and again at the end:

```bash
npm run build
npm run test:e2e:snapshots
# on failure:
npx playwright show-report
npm run test:e2e:review-snapshots
```

Review PNGs in `test-results/snapshot-review/` (`*-expected.png`, `*-actual.png`, `*-diff.png`).

**Allowed to update a baseline:** a documented, unavoidable Nuxt chrome change (e.g. one extra `#__nuxt` node in the page ARIA tree) after showing the diff.

**Not allowed:** updating baselines because a class was renamed, a heading changed, spacing drifted, or a result card was “simplified.”

## Likely friction (watch these)

- Extra component wrappers breaking `.form-grid-2` / `.hero-stats` / tab flex children.
- Hydration mismatches from `new Date()` (annual year options, sold dates). Pin the option list the same way the backup does (`now` down to 2020) and accept SSR/client same-year.
- `display:none` vs `v-if` for twin fields / Cirrus generation — snapshots and a11y expect the nodes to exist and hide, not to be missing. Prefer `v-show` or inline `display` like the backup.
- Checklist `onclick="clStatus(...)"` becomes Vue handlers; keep button `aria-label`s (`Pass` / `Flag` / `Fail`) and `aria-pressed` / `aria-valuenow` updates.
- Sold `#sd-date` is `<input type="month">` — keep that, tests fill by id today (`#sd-date`) and by label.
- Partner-tip interval during valuation load — same markup on `#v-partner-tip`.

## Out of scope

- Auth, Stripe, quota UI.
- Redesign, new tokens, or “while we’re here” copy edits.
- Changing server valuation/checklist/lookup logic.
- Weakening or rewriting E2E assertions.
