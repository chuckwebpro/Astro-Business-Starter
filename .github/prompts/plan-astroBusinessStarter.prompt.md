## Plan: Astro + Tailwind Business Site Starter

Build a **Git template repo** (`astro-business-starter`) you clone per client. It ships a token-driven theme layer, a library of composable page blocks, an accessible mega-menu header, and full SEO — output as pure static HTML for cPanel. It is deliberately a **starting point, not a framework**: three fixed pages, no CMS, no content collections until a project needs one.

**Why template repo over shared npm package:** you want full per-client component overrides. A published package fights that (you'd constantly eject). A template gives total freedom; you backport genuinely reusable improvements upstream.

**Tokens are the contract, not Figma.** `tokens/*.json` is the single input to the theme layer. Those tokens can come from a Figma library via Tokens Studio, from another design tool's export, or from you editing the JSON by hand. Nothing downstream knows which. The starter ships a working default set so it builds standalone from day one.

### Phase 1 — Foundation & tooling
1. Scaffold Astro 5 minimal + TypeScript strict. Set `output: 'static'`, `site`, **`trailingSlash: 'always'`**, and `build.format: 'directory'` — the pair that produces `/about/index.html` and matches Apache's `DirectoryIndex` behavior without redirect churn. Pinning this now matters: it drives the `.htaccess` rules, internal link shape, and whether log paths stay comparable release to release.
2. Install everything the later phases assume, in one pass. **Tailwind CSS v4 via `@tailwindcss/vite`** — the `@astrojs/tailwind` integration is deprecated, do not use it — plus `@astrojs/sitemap`, `@astrojs/mdx`, `astro-icon` + an icon set, `@fontsource-variable/*` for the chosen typeface, and `style-dictionary` as a dev dependency for the token build. (`@astrojs/rss` arrives with the collection template, not here — it's dead weight on a site with no feed.)
3. Add Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`, `.editorconfig`, `.nvmrc`, a `.gitignore` (`node_modules/`, `dist/`, `.astro/`, and the generated `src/styles/theme.css`), and `astro check` behind a `verify` script.
4. `public/` gets the server-side furniture: an `.htaccess` template for cPanel (gzip/brotli, cache headers, HTTPS + www redirects, `ErrorDocument` pointing at `/404/`, and trailing-slash rules matching item 1) plus a `robots.txt` referencing the generated sitemap — `@astrojs/sitemap` does not create one. Configure the sitemap integration's `filter` to drop `/thank-you/` and `/styleguide/`.
5. **Seed the default theme — this is what makes the repo self-contained.** Commit a neutral demo brand as `tokens/*.json` (W3C DTCG). The token build runs as a `prebuild` step, so a fresh clone produces a themed, rendering site with no manual step and nothing stale to commit.
6. **`README.md` is the operating manual**, not a description. Lead with a **"populate before you build" checklist**, each item marked *required* or *optional* — this is the source material that `npm run setup` (item 43) later automates:
    - `src/config/site.ts` — business name, NAP, hours, socials, schema.org type *(required)*
    - `src/config/navigation.ts` — nav tree and mega panel content *(required)*
    - `tokens/*.json` — replace the demo brand; the theme regenerates on next build *(required)*
    - `src/assets/logo.svg` + favicon set *(required)*
    - `public/robots.txt` — confirm the sitemap URL matches the domain *(required)*
    - A content collection copied from `_templates/collection/` *(optional — only if the site has a blog or similar)*
    - Formspree form ID, analytics + verification IDs in `site.ts` *(optional, per platform)*
    - `.github/workflows/deploy.yml` — FTP host/path secrets *(required to publish)*
  Follow it with the standing commands (`dev`, `build`, `verify`, `setup`) and links to `docs/`.

### Phase 2 — Theme layer & primitives *(must precede Phase 3)*
7. **Token pipeline:** Style Dictionary reads `tokens/*.json` and emits `src/styles/theme.css` — the Tailwind v4 `@theme` block holding color scales, font families, radii, shadows, `container/max` (**1350px**), and section spacing. It runs from `predev`, `prebuild`, **and `preverify`**, so no entry point can hit a missing stylesheet on a fresh clone. `theme.css` is gitignored; `tokens/*.json` is the only committed source. **There is no override stylesheet** — if one place needs a different value, that's a component-level concern (a prop or a local class), not a global escape hatch. One source, no drift.
8. **Token sources are pluggable.** A designer using the shared Figma library pushes via Tokens Studio (see Appendix); a one-off design gets transcribed into the JSON; a project with no designer just gets hand-edited values. Document all three in `docs/THEMING.md` so no project is blocked waiting on a design tool.
9. `src/config/site.ts` — typed `SiteConfig`: business name, NAP (address/phone/hours), social profiles, analytics IDs, Formspree form ID, default OG image, schema.org business type (`LocalBusiness` vs `ProfessionalService` vs `Dentist` etc.).
10. `src/components/ui/` primitives consuming tokens only. The layout pair is deliberately **two nested wrappers**, mirroring how these pages actually get designed:
    - **`Section`** — the outer element, always 100% viewport width. Owns the *canvas*: background color/image/gradient, vertical rhythm, optional overflow clipping, and the semantic tag via an `as` prop. Nothing inside it needs to know the page is wider than the content.
    - **Rhythm rule, decided once so it never drifts:** `Section` applies **symmetric** `padding-block` from `space/section-y` (a colored band needs air on both sides), and writes its background choice to a `data-bg` attribute. A single global rule collapses the seam when two identical backgrounds meet — `[data-bg='base'] + [data-bg='base'] { padding-block-start: 0 }` — so stacked plain bands read as one continuous flow while a color change keeps its full breathing room. This is the failure mode of every band-based system; solve it in the primitive, not per block.
    - **`Container`** — the inner element, `max-width: 1350px`, centered with horizontal gutters. Owns the *content*: layout mode (`stack | row | grid`), alignment, and gap, all from tokens. **No `full` escape variant** — a block that wants edge-to-edge media simply doesn't render a `Container` around it. One way to do it.
    - **Layout ownership:** `Container`'s modes serve simple blocks. Any block with bespoke internal layout (`ServicesGrid`, `Team`, `Pricing`) uses `stack` and owns its own grid inside — `Container` is never asked to model a block-specific arrangement.
    - Then `Button`, `Card`, `Heading`, `Prose`, `Icon` (astro-icon).
  Every block is `Section > Container > content`, so "change the band's background" and "change how the content sits" are always two different props on two different elements. **`Header` and `Footer` are the exceptions** — both own their outer element directly (the header needs its own positioning context for sticky behavior), though both use `Container` inside.
11. **Desktop-first responsive defaults, written now in `docs/RESPONSIVE-RULES.md`.** Sensible starting behavior you correct by eye during the build, not a contract:
    - Author base styles at desktop, step down with Tailwind's **`max-*` variants** (`max-lg:`, `max-md:`, `max-sm:`). Declare breakpoints once via `--breakpoint-*` in `@theme`.
    - Multi-column grids and card rows collapse to one column below `md`; three-up goes two-up at `lg` first where that reads better.
    - Side-by-side image/text splits stack **image first**.
    - Fluid type and section padding scale with `clamp()`; pick a reasonable mobile floor and adjust during the build.
    - Tap targets reach 44px below `md`; tables scroll horizontally rather than shrink.
    - Default stacking is DOM order. A block needing a different small-screen order exposes an explicit prop rather than inline `order` utilities.
    - Log any correction you make twice into this file so it graduates into a default.

### Phase 3 — Layout, header & SEO *(ships a working, deployable site)*
12. `BaseLayout.astro` — `<head>` orchestration, font preload (self-hosted via Fontsource), skip-link, `Header`, `Footer`, slot for page content.
13. **`Header.astro` — the component every page depends on.** Owns its own outer element rather than wrapping in `Section`, since sticky positioning needs its own stacking and positioning context; it uses `Container` inside for alignment. Composes logo lockup, primary nav, and phone/CTA button. **It starts with a plain link-list nav and a simple mobile disclosure** so Phase 3 stands alone and deploys; Phase 4 swaps the nav slot for the mega menu without touching anything else. Sticky behavior is a typed prop — `'static' | 'sticky' | 'shrink' | 'hide-on-scroll'` — implemented once with a scroll listener behind `requestAnimationFrame`, reserving header height so nothing shifts when it changes state. Honors `prefers-reduced-motion`.
14. `Footer.astro` rendering NAP + hours + social + legal links from config.
15. `SEO.astro` — title templating, description, canonical, robots, Open Graph, Twitter card, per-page OG image with a static fallback.
16. `Schema.astro` — JSON-LD graph: `Organization`/`LocalBusiness` from `site.ts`, `WebSite`, plus opt-in per-page `BreadcrumbList`, `Service`, and `FAQPage`. This is the biggest SEO win over the Elementor sites you're leaving.
17. **Three fixed pages only** — `index.astro`, `404.astro`, `thank-you.astro`. Everything else (about, services, contact, legal, any blog) is added per project from the block library. The starter's `index` is assembled from real blocks so it doubles as a working example and a smoke test.

### Phase 4 — Navigation subsystem *(the mega menu; upgrades the Phase 3 header)*
18. **One data source, two renderings.** `src/config/navigation.ts` defines a typed nav tree — up to two levels, where a second-level node is either a simple link list *or* a `mega` panel describing columns, per-item icon/description, and an optional featured card. Desktop and mobile render the *same* tree, and the simple nav from item 13 reads it too, so the upgrade is additive rather than a rewrite.
19. `MegaMenu.astro` — **`md` (768px) and up, covering tablet and desktop**, replacing the simple desktop nav in `Header`. Top-level items owning a panel are `<button aria-expanded aria-controls>` disclosures, not links; the panel is a plain `<div>` of `<ul>` columns. **Do not use `role="menubar"`/`role="menuitem"`** — that's the ARIA application pattern and it degrades normal browsing for screen reader users.
20. `MobileNav.astro` — **below `md`**, a standard component reused across projects. Full-height drawer, accordions from the same tree, `inert` on the rest of the page while open, body scroll lock, focus restored to the trigger on close, 44px tap targets, safe-area insets, and a visible "back" affordance rather than infinite indentation.
21. **The panel must survive 768px**, since the mega menu runs on tablet: columns halve, the panel goes container-width rather than full-bleed, and `@media (hover: hover)` gates hover so touch tablets don't get a menu that opens and instantly closes.
22. **Interaction contract, written once:** opens on hover *and* focus, ~150ms open / ~300ms close intent delay to survive diagonal mouse travel, click toggles for touch and keyboard, `Escape` closes and returns focus to the trigger, one panel open at a time, closes on outside click. Honors `prefers-reduced-motion`.
23. **No-JS baseline:** operable via `:focus-within` / `<details>` before a ~1KB inline script adds intent delays and `Escape`. Also your defense against the panel flashing open on load. Keep panel markup lean — it ships in the HTML of every page.

### Phase 5 — Block library (the "Elementor replacement")
24. Build `src/components/blocks/` — named *blocks*, not *sections*, so the word "Section" only ever means the `ui/Section` wrapper: `Hero`, `ServicesGrid`, `FeatureSplit` (alternating image/text), `Testimonials`, `FAQ` (accordion + `FAQPage` schema), `Team`, `Pricing`, `Stats`, `ProcessSteps`, `LogoCloud`, `CTABanner`, `ContactBlock`, `MapEmbed` (lazy iframe facade). The naming also lines up with the `astro-blocks` registry in Phase 10.
25. **Every block is props-only — it never queries content directly.** Data arrives as a typed prop, so a block works identically fed a hardcoded array today or a collection query later. This is what keeps blocks portable and lets the content layer stay optional.
26. Each block renders `Section > Container > content` and forwards a `background`/`spacing` prop to `Section` and an `align` prop to `Container`, so pages are assembled declaratively. Blocks with bespoke internal layout own their grid per item 10. Each block owns its collapse behavior per item 11.
27. **Living style guide** at `/styleguide`, rendering every primitive and block in all variants — including `Section` backgrounds stacked back-to-back, which is where vertical rhythm collisions show up. Because a plain `.astro` page always builds in static output, implement it as a rest route (`src/pages/[...styleguide].astro`) whose `getStaticPaths()` returns `[]` unless `STYLEGUIDE=1` — that's the only clean way to keep it out of a normal production build. When it is built it ships `noindex` and is excluded by the sitemap filter. Always available in `dev`.

### Phase 6 — Content *(optional, added per project)*
28. **No collection ships by default.** Many of these sites are pure marketing — a blog that doesn't exist shouldn't cost routes, schemas, or an RSS endpoint. `@astrojs/mdx` is installed and ready, and that's the extent of the standing commitment.
29. `docs/ADDING-A-COLLECTION.md` is the recipe, with a **copyable `_templates/collection/` folder** holding a Zod schema stub, an index route, a `[slug].astro` detail route, an RSS endpoint, and its own `new:entry` scaffolder. Adding a blog — or `news`, `insights`, `projects`, `services`, whatever the client calls it — is: copy, rename, define the Zod schema by hand, feed it to an existing block. Write the schema directly in `src/content.config.ts`; no descriptor layer, no code generation. The scaffolder ships *with* the collection rather than sitting in the starter with nothing to scaffold.
30. Whatever collection exists filters `draft: true` out of production builds, so work-in-progress lives safely on `main`. Install `@astrojs/rss` at that point, not before.
31. Legal pages (privacy, terms) are added per project as needed. **A privacy policy is required whenever Meta or Google tags are enabled** — their platform terms mandate one regardless of jurisdiction.

### Phase 7 — Forms & analytics
32. **Formspree** contact form: `<form action={`https://formspree.io/f/${site.formspreeId}`} method="POST">` with a `_gotcha` honeypot, `_subject`, and `_next` set to an **absolute URL** — `${site.url}/thank-you/`, trailing slash included to match item 1. Formspree ignores relative paths, which fails in a way that looks like a form bug. Progressive enhancement: a small `fetch()` handler for inline success/error states, with the plain POST as the no-JS fallback.
33. Reusable `Field`/`FormMessage` primitives + client-side validation via the native constraint API (`required`, `type="email"`, `pattern`) so no validation library ships. Enable Formspree's reCAPTCHA in-dashboard for high-spam clients.
34. **Server log analytics is the baseline, and it costs the page nothing.** Because you own the cPanel server, traffic is measured from access logs (GoAccess, or cPanel's built-in AWStats/Webalizer) with **zero client-side JavaScript, no consent prompt, and no ad-blocker loss**. Support it from the build side: keep `trailingSlash` and URL structure stable so log paths stay comparable release to release, and keep 404s and redirects clean so reports aren't polluted.
35. **Third-party tags are opt-in per client, only for ad attribution.** `site.ts` carries a typed `analytics` block — `ga4`, `gtm`, `metaPixel`, `bingUet`, `clarity` — plus a `verification` block for the `<meta>` tags each platform wants (`google-site-verification`, `msvalidate.01`, `facebook-domain-verification`). Every tag is **optional**: absent ID means zero bytes shipped. A client not running paid ads ships none of them and still gets full traffic reporting from logs.
36. `Analytics.astro` renders each configured tag from a single map, so adding a platform is a config edit rather than surgery on the layout. Scripts inject on `requestIdleCallback` or first interaction — never render-blocking.
37. **No consent banner by default.** US-only clients, log analytics as the baseline, and no EEA obligation means a banner is dead weight — it costs conversions and adds JS for nothing. Keep a `consent: 'none' | 'banner'` switch in `site.ts` for the exceptions (a client selling into the EU/UK, or one large enough to trigger CCPA/CPRA). When enabled it's category-based and wires GA4 Consent Mode v2, Meta's Limited Data Use flag, and Bing UET's consent API.
38. **US-specific exposure worth knowing:** session-replay and pixel tracking have drawn a wave of California wiretapping (CIPA) suits. Keep **Microsoft Clarity off by default**, and raise "Do Not Sell or Share" plus Global Privacy Control with any client large enough to fall under CPRA. Per-client decisions, not starter scope.
39. One `trackConversion()` helper fans out a lead event to whichever platforms are configured — GA4 `generate_lead`, Meta `Lead`, Bing UET `submit_lead_form` — so numbers reconcile. With no tags configured it's a no-op, so pages need no conditional wiring.

### Phase 8 — Quality budget
40. Image discipline: all imagery through `astro:assets` `<Image>`/`<Picture>`, AVIF+WebP, explicit dimensions, `loading="eager"` + `fetchpriority="high"` only on the hero. Art-direct with `<Picture>` where a desktop-composed hero crops badly on mobile.
41. Add `@lhci/cli` config with assertions (Perf/A11y/SEO/Best-Practices ≥ 95) plus `pa11y-ci`, wired into a GitHub Action alongside `astro check` and `prettier --check`. Run Lighthouse in **mobile** emulation as the gating profile, measured with **all tags enabled**.
42. **Deploy pipeline:** a GitHub Action that builds and FTP-deploys `dist/` to cPanel on every push to `main`, gated behind `astro check` so a broken build never ships. This is what makes "edit, commit, done" a real workflow instead of a manual upload ritual.

### Phase 9 — Template-ization
43. **`npm run setup` — an interactive scaffolder that resolves the per-project questions in one pass**, replacing most of the README checklist with answers. It prompts for, then writes:
    - Business name, domain, NAP, hours, socials, and schema.org type → `src/config/site.ts`
    - **"Does this site need a content collection?"** → if yes, asks its name (`posts`, `news`, `insights`, `projects`…) and singular/plural labels, then copies and renames `_templates/collection/` and registers the schema. If no, nothing is added and nothing has to be deleted later.
    - Header sticky behavior → the `Header` prop
    - Formspree form ID, and each analytics/verification ID with blank meaning "skip this platform entirely"
    - Whether a consent banner is needed → the `consent` switch
    - GitHub repo owner/name and cPanel deploy path → `package.json`, `deploy.yml`
    - Finally, clears the demo home page blocks and demo token values on confirmation. The demo `index` therefore lives on in the template repo as its permanent smoke test, while each clone replaces it.
  Build this **after** the first pilot, not before — the prompts should encode setup steps you've actually performed, not ones you imagine.
44. `README.md` (item 6) remains the authoritative manual for anything `setup` doesn't cover, and `docs/NEW-PROJECT.md` carries the workflow narrative around it.
45. `docs/THEMING.md`: how tokens get produced and applied, covering all three intake paths (Figma/Tokens Studio, transcribed from another design source, hand-authored).
46. `docs/DESIGNER-BRIEF.md`: the appendix as a standalone handover document, given to a designer when one is involved. Version it — it's the artifact that makes each successive designed project faster.
47. `docs/HOSTING.md`: the cPanel runbook — FTP deploy credentials and paths, `.htaccess` behavior, GoAccess report generation and its cron entry, log retention.
48. Mark the repo as a GitHub **template repository**. Pilot it on one real client site; log friction and backport fixes into the starter, `RESPONSIVE-RULES.md`, and the `setup` prompts.

### Phase 10 — Shared component registry *(ongoing, starts after pilot #2)*
49. Stand up a second repo, `astro-blocks`: a **shadcn-style registry** rather than an npm dependency. Each block is a folder containing the `.astro` file(s), a `meta.json` (description, dependencies, required tokens), a preview screenshot, and a usage snippet.
50. `npx astro-blocks add testimonials-marquee` copies source *into* the project. You own the code immediately — this is what makes a shared library compatible with the full per-client overrides you want.
51. Every block must be token-only (no hardcoded colors/spacing), props-only (no direct content queries), render correctly under any `theme.css`, and ship with its collapse behavior built in.
52. **Promotion ritual:** after each client project, review new and modified components. Anything used twice gets generalized, tokenized, screenshotted, and promoted into the registry. Anything used once stays in the client repo. Nav panel layouts and hero variants are prime candidates.
53. Deploy the registry's style guide as a static site — a browsable catalog shared with clients during design to pre-select layouts, and with a designer as the canonical "what already exists" reference.

### Appendix — Working with a Figma design *(optional, when one is provided)*

The starter never requires Figma. When a designer *is* involved, these conventions make the handoff mechanical instead of interpretive — hand them `docs/DESIGNER-BRIEF.md`, generated from this appendix.

- **Library structure:** one Figma *Variable collection* per token group, slash-nested to match CSS (`color/brand/50…950`, `font/sans`, `radius/md`, `space/section-y`, `container/max` = 1350px). Seed it from the starter's committed default tokens so Figma and code start identical. One *Component* per Astro component, named identically (`Block/Hero`, `UI/Button`), with variants matching prop names.
- **Token rules:** every color, radius, spacing, and type value comes from a variable — never a raw hex or arbitrary pixel value. Spacing uses the defined scale only. Auto Layout on every frame, padding and gap from spacing variables.
- **Canvas:** a single **1920 (FHD)** artboard. Content sits in a **1350px centered container**; full-bleed backgrounds, hero imagery, and the mega panel may span the full width, text and cards never do. Nothing reflows between 1350 and 1920.
- **No tablet or mobile comps** — those are developer-owned per `RESPONSIVE-RULES.md`. Group elements in the order they should stack.
- **States:** default, hover, focus, active, disabled, plus empty/error for forms.
- **Navigation** needs its own pass: trigger behavior per item, panel anatomy, the panel drawn at both minimum (2 items) and maximum (12+) density **and at 768px**, longest-label behavior using real link text, and the sticky header's scrolled state.
- **Type from open, self-hostable families only** (Google Fonts or similar) — licensed webfonts requiring a third-party loader break the preload strategy.
- **Delivery:** tokens pushed as `tokens/*.json` via the Tokens Studio plugin's GitHub sync; icons exported as SVG; photography supplied as originals rather than pulled from the file.
- Real copy, not lorem ipsum. Never detach instances. WCAG AA contrast.

### Verification
1. **Fresh-clone smoke test:** clone the template, `npm install && npm run build` with nothing customized — the demo brand builds, renders, and passes `astro check`. If a clone can't build untouched, the starter isn't a starter.
2. Change one brand color in `tokens/*.json`, rebuild, and confirm the change propagates with no other diff and no manual step — `theme.css` is regenerated, never edited. Confirm it's absent from `git status`.
3. Grep the codebase for hardcoded hex values and arbitrary Tailwind bracket values (`[#`, `[1`) — anything outside `tokens/*.json` is a token that should exist or a component-level decision that should be a prop.
4. Follow `README.md`'s populate checklist end-to-end on a throwaway project without consulting the plan. Anything you have to guess is a gap in the README.
5. Compare `/styleguide` against whatever design source exists at 1920 px — spacing, type scale, and color match, and the content container measures 1350px. With no design source, check it against the token values directly.
6. **Small-screen sweep at 375 / 768 / 1024** on every block in `/styleguide`: no horizontal scroll, no overlapping text, no tap target under 44px. Expect to hand-correct a few blocks; fold repeat corrections into `RESPONSIVE-RULES.md`.
7. **Wrapper separation:** change a block's `Section` background and confirm it spans the full viewport width edge to edge; change its `Container` alignment and confirm the band's background is untouched.
8. **Rhythm seam:** stack two blocks with the *same* background and confirm the gap between them equals one section pad, not two; then change one background and confirm the full pad returns on both sides.
9. **Header states:** cycle the sticky prop through all four values and confirm no layout shift when the header changes state, and that `prefers-reduced-motion` suppresses the transition.
10. **Mega menu at 768px** (tablet): panel fits, columns halve, and on a touch tablet the first tap opens rather than opens-and-closes.
11. **Navigation, keyboard only:** Tab to each top-level trigger, `Enter`/`Space` opens, `Tab` moves through panel links, `Escape` closes and returns focus to the trigger. No focus ever lands inside a visually hidden panel.
12. **Navigation, screen reader** (NVDA or VoiceOver): triggers announce as buttons with expanded/collapsed state; panel content is reachable in normal browse mode, not trapped in an application-mode menubar.
13. **Navigation, no JS:** disable JavaScript and confirm every nav destination is still reachable at both mobile and desktop widths.
14. Mega panel at a 1366×640 viewport — panel does not exceed the viewport, scrolls internally, and never pushes content off-screen.
15. Diagonal mouse travel from a trigger to the far corner of its panel does not close it mid-move.
16. Mobile drawer open: background content is `inert`, body scroll is locked, and closing restores focus to the hamburger.
17. Render the nav with 2 items and with 12 items per column; confirm no overflow, no column imbalance, and no layout shift.
18. `npx serve dist` + Lighthouse CI on the **mobile** profile — all four categories ≥ 95 on the home page.
19. Paste the built home page into Google Rich Results Test — `LocalBusiness` and any opt-in schema valid.
20. Upload `dist/` to a cPanel test subdomain — verify `.htaccess` redirects, that `404.astro` is actually served on a bad URL, that `robots.txt` resolves and points at the real sitemap, and that **no URL 404s or double-redirects from a `trailingSlash` mismatch** (check both `/about` and `/about/`).
21. Confirm `sitemap-index.xml` contains the real pages and **excludes `/thank-you/` and `/styleguide/`**.
22. **Phase 3 standalone check:** at the end of Phase 3, before any mega menu exists, the site builds and deploys with a working simple nav. If it doesn't, the header has taken a dependency it shouldn't have.
23. Submit the Formspree form end-to-end with JS on and off; confirm delivery, that `_next` actually lands on `/thank-you/` (absolute URL, trailing slash), and that `_gotcha` blocks a scripted POST.
24. **No-tags baseline:** with every `analytics` ID blank, confirm the build ships **no third-party requests at all** — and that the log report still attributes that traffic correctly.
25. Generate a GoAccess report from a day of real access logs and confirm asset paths and bot traffic are excluded, and that page paths match the site's `trailingSlash` setting.
26. **Tags enabled:** verify GA4 in DebugView, Meta Pixel via the Pixel Helper extension, and Bing UET via UET Tag Helper — each firing exactly once per page view.
27. Submit the contact form and confirm one lead conversion lands in every configured platform from the single `trackConversion()` call.
28. Blank out `metaPixel` and `bingUet` in `site.ts`, rebuild, and grep `dist/` — zero references to either vendor should remain.
29. Flip `consent: 'banner'` and confirm the banner appears, blocks tags until accepted, and that flipping back to `'none'` removes it entirely from the build.
30. Confirm verification `<meta>` tags render for Google, Bing, and Meta, and that Bing Webmaster Tools accepts the sitemap.
31. **Add-a-collection dry run:** follow `docs/ADDING-A-COLLECTION.md` to copy `_templates/collection/` into a working `insights` collection with a hand-written Zod schema, and confirm index, detail, and RSS routes build. Then delete it and confirm the site still builds clean — the content layer must be genuinely removable.
32. Confirm a `draft: true` entry renders in `dev` but is absent from `dist/`, the feed, and the sitemap.
33. Save an entry with a missing required frontmatter field and confirm CI fails on `astro check` rather than deploying a broken build.
34. Keyboard-only pass on the FAQ accordion; `pa11y-ci` clean.
35. Registry smoke test: `add` a block into a fresh clone with different tokens and confirm it renders on-brand with zero edits.
36. Confirm `/styleguide` is absent from a normal production build, and present with `noindex` when built with `STYLEGUIDE=1`.
37. **`setup` script, both branches:** run it answering "yes" to a content collection and confirm the renamed collection builds; run it again on a clean clone answering "no" and confirm no orphaned routes, schemas, or RSS endpoints remain.

### Decisions
- **A starting point, not a framework.** Three fixed pages, no CMS, no content collections, no page-builder abstraction. Everything else is added per project. Anything that can't justify itself on the *next* site doesn't belong in the starter.
- **Static-only** — rules out Astro Actions, API routes, and SSR-based form handling. All dynamic behavior is third-party or client-side.
- **`trailingSlash: 'always'` + `build.format: 'directory'`**, pinned at scaffold time because `.htaccess` rules, internal links, and log-path comparability all depend on it.
- **Phase 3 must deploy without Phase 4.** The header ships a simple nav first and gains the mega menu as an additive swap, so the mega menu can never block a working site.
- **`tokens/*.json` is the theme contract; the source of those tokens is deliberately unspecified.** Figma via Tokens Studio, another tool's export, or hand-authored — the pipeline can't tell the difference, so no project is ever blocked waiting on a design file.
- **The starter ships committed default tokens and builds standalone.** A fresh clone renders before any design exists.
- **Automation follows experience.** `npm run setup` is written after the first pilot, encoding steps actually performed; scaffolders ship alongside the thing they scaffold, never ahead of it.
- **The theme is generated at build time from `tokens/*.json`, and there is no override stylesheet.** `theme.css` is gitignored and never hand-edited. A one-off visual exception is a component-level decision — a prop or a local class — not a global escape hatch. One source of truth, no drift.
- **"Section" and "Container" are two different jobs.** `Section` is the full-width outer band that owns the background and vertical rhythm; `Container` is the 1350px centered inner wrapper that owns content layout. Every block is `Section > Container > content`. The block library lives in `components/blocks/` so the word "section" is never overloaded.
- **Open, self-hostable fonts only** (Google Fonts family via Fontsource). No Adobe Fonts or per-domain-licensed webfonts.
- **Formspree** for all forms. Requires a paid plan past ~50 submissions/month per project — price it into client retainers.
- Registry uses **copy-in (shadcn model), not an npm dependency** — the only model compatible with full per-client component overrides.
- No React/Vue by default — keeps JS payload near zero. Add an island only where genuinely interactive.
- **Blocks are props-only and never query content directly.** This is what makes the content layer optional and the blocks portable.
- **No collection ships.** A blog may not exist, and when it does it may be called something else — so content is a copyable template plus a hand-written Zod schema, not a resident feature.
- **No CMS.** If a client ever needs to self-publish, that's a per-project add-on and billable scope, not starter overhead.
- **Everything runs on your own cPanel infrastructure.** The only external services are GitHub (source + CI) and Formspree.
- **Log-based analytics is the default measurement layer**; GA4, Meta, and Bing tags are opt-in per client, only when ad attribution requires them.
- **No consent banner by default** — US-only clientele, no EEA obligation. A `consent` switch covers the exceptions rather than taxing every site.
- **Mega menu runs at `md` (768px) and up — tablet included.** Below `md`, the standard mobile drawer. One breakpoint, decided once.
- **Disclosure pattern, not ARIA menubar**, for the mega menu. `role="menubar"` is for application UIs and degrades normal browsing for screen reader users.
- **Tablet and mobile are developer-owned**, built desktop-first with Tailwind `max-*` variants against defaults corrected by eye during the build.

### Further Considerations
1. **Token intake when there's no designer** — hand-authoring `tokens/*.json` is fine and fully supported. The one rule that matters: if you find yourself wanting to edit `theme.css`, the value belongs either in the tokens or in a component prop. There's no third option by design.
2. **If a Figma design does arrive**, note that Figma's Variables REST API is **Enterprise-plan only** — Tokens Studio's GitHub sync is the practical path. Confirm its free tier covers your token set before promising the designer a workflow.
3. **Log analytics has real gaps** — no scroll depth, no in-page events, no cross-device attribution, and bot filtering is only as good as your config. It answers "how much traffic and to which pages", not "what did people do". Decide per client before selling it as the reporting layer.
4. **US privacy still bites, just differently than GDPR** — CCPA/CPRA applies above thresholds most local businesses won't hit, but California wiretapping (CIPA) suits over pixels and session replay target businesses of any size. Keep Clarity off by default.
5. **A privacy policy is still required** whenever Meta or Google tags are enabled — their platform terms mandate one independent of any statute.
6. **Watch the block library for creep.** Thirteen blocks is already generous for a starter; if three go unused across the first two projects, cut them to the registry instead of carrying them in every clone.
7. **Registry distribution** — A) public GitHub repo + a thin `npx` CLI (recommended) / B) private repo with git-subtree pulls / C) a plain "copy from this folder" convention with no tooling (start here, add the CLI once you hit ~15 blocks).
8. **Mega menu JS approach** — A) ~1KB of vanilla JS in a shared inline script (recommended; zero dependencies, no hydration flash) / B) Alpine.js (~15KB, faster to author, worth it only with several other interactive widgets) / C) CSS-only via `:focus-within` and `<details>` (no intent delay, no `Escape`).
9. **Where desktop-first will hurt** — heroes with text baked into imagery, wide data tables, and multi-column pricing. These are the blocks you'll hand-correct most.
10. **Direct tags vs GTM** — A) inject each vendor snippet directly (recommended at two or three tags) / B) one GTM container (a marketer can add tags without you, but GTM costs ~90KB before a single tag fires and hands a non-developer the ability to wreck the performance budget).
11. **Meta Conversions API is out of reach for a static build** — it needs a server-side call. If a client running Meta ads needs it, the same cPanel account can host a small PHP relay; per-client add-on, not starter scope. Otherwise set the expectation that browser-only Pixel data undercounts against ad-blockers and iOS.
12. **If a client ever asks to self-publish**, add a CMS to that project only. The cheaper answer for most: quote a small retainer and write the content yourself — you're faster in Markdown than they'll be in any admin UI.
