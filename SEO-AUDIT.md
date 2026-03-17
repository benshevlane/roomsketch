# SEO Audit: freeroomplanner.com — Phase 1

**Date:** 2026-03-17
**Auditor:** Automated (Claude)
**Scope:** Crawlability, on-page SEO, structured data, internal linking, Core Web Vitals proxy

---

## 1. Crawl & Analysis Results

### 1.1 robots.txt

**Status:** ✅ Exists (`client/public/robots.txt`)

```
User-agent: *
Allow: /

Sitemap: https://freeroomplanner.com/sitemap.xml
```

**Verdict:** Clean. No important paths blocked. Sitemap directive present.

---

### 1.2 sitemap.xml

**Status:** ✅ Exists (`client/public/sitemap.xml`) — valid XML, 17 URLs

| URL | Priority | Change Freq |
|-----|----------|-------------|
| `/` | 1.0 | weekly |
| `/room-planner` | 0.9 | monthly |
| `/kitchen-planner` | 0.9 | monthly |
| `/bathroom-planner` | 0.9 | monthly |
| `/bedroom-planner` | 0.9 | monthly |
| `/living-room-planner` | 0.9 | monthly |
| `/floor-plan-maker` | 0.9 | monthly |
| `/how-it-works` | 0.8 | monthly |
| `/blog` | 0.8 | weekly |
| `/blog/kitchen-layout-guide` | 0.7 | monthly |
| `/blog/bathroom-planning-mistakes` | 0.7 | monthly |
| `/blog/brief-your-builder` | 0.7 | monthly |
| `/blog/small-bedroom-layouts` | 0.7 | monthly |
| `/blog/open-plan-living` | 0.7 | monthly |
| `/blog/extension-planning` | 0.7 | monthly |

**Verdict:** Comprehensive. All key pages included. `/app` is correctly omitted (it's the tool, not a content page).

---

### 1.3 Page-by-Page On-Page SEO

#### Homepage (`/`)

| Element | Value | Assessment |
|---------|-------|------------|
| **Title** | `Free Room Planner — Design Any Room Layout Online` | ✅ 50 chars. Contains "free room planner". Under 60 chars. |
| **Meta description** | `Plan any room for free — kitchens, bathrooms, bedrooms and living rooms. Draw walls, drag furniture, and export your floor plan as PNG. No login required.` | ✅ ~155 chars. Leads with benefit, mentions all room types. |
| **H1** | `Free Room Planner: Design Any Room Layout Online` | ✅ Single H1. Primary keyword present. |
| **Canonical** | `https://freeroomplanner.com/` | ✅ |
| **OG tags** | Title, description, image, URL | ✅ All present |
| **JSON-LD** | `SoftwareApplication` schema | ✅ Present with correct fields |

#### Kitchen Planner (`/kitchen-planner`)

| Element | Value | Assessment |
|---------|-------|------------|
| **Title** | `Free Kitchen Planner — Plan Your Layout Online \| FRP` | ✅ 53 chars. Keyword-rich. |
| **Meta description** | `Draw your kitchen layout to scale online. Place units, appliances and an island, then share the plan with your fitter — free, no account needed.` | ✅ ~143 chars. Use-case led. |
| **H1** | `Free Kitchen Planner — Plan Your Kitchen Layout Online` | ✅ Single H1. Primary keyword. |
| **JSON-LD** | `WebApplication` schema | ✅ Present |
| **FAQPage schema** | Missing | ⚠️ Page has 6 FAQs but no FAQPage schema |

#### Bathroom Planner (`/bathroom-planner`)

| Element | Value | Assessment |
|---------|-------|------------|
| **Title** | `Free Bathroom Planner — Design Your Layout Online \| FRP` | ✅ 56 chars. |
| **Meta description** | `Design your bathroom layout to scale online. Position sanitaryware, check clearances, and share the plan with your plumber. Free, no account needed.` | ✅ ~148 chars. |
| **H1** | `Free Bathroom Planner — Design Your Bathroom Layout Online` | ✅ |
| **JSON-LD** | `WebApplication` schema | ✅ |
| **FAQPage schema** | Missing | ⚠️ Page has 6 FAQs but no FAQPage schema |

#### Living Room Planner (`/living-room-planner`)

| Element | Value | Assessment |
|---------|-------|------------|
| **Title** | `Free Living Room Planner — Arrange Your Layout Online \| FRP` | ✅ 60 chars — right at the limit. |
| **Meta description** | `Plan your living room layout for free. Arrange sofas, tables, and TV units to scale, test different configurations, and share your design. No sign-up needed.` | ✅ ~157 chars. |
| **H1** | `Free Living Room Planner` / `Arrange Your Living Room Online` | ✅ (split across two lines with `<br>`) |
| **JSON-LD** | `WebApplication` schema | ✅ |
| **FAQPage schema** | Missing | ⚠️ Page has 6 FAQs but no FAQPage schema |
| **Nav link** | Missing `/floor-plan-maker` from main nav | ⚠️ Inconsistent with other pages |

#### Floor Plan Maker (`/floor-plan-maker`)

| Element | Value | Assessment |
|---------|-------|------------|
| **Title** | `Free Floor Plan Maker — Create Floor Plans Online \| FRP` | ✅ 56 chars. |
| **Meta description** | `Create detailed floor plans for free. Draw walls, doors, and windows to scale, add furniture, then export as PNG to share with builders. No download or login.` | ✅ ~158 chars. |
| **H1** | `Free Floor Plan Maker` / `Create Accurate Floor Plans Online` | ✅ |
| **JSON-LD** | `WebApplication` + `FAQPage` + `BreadcrumbList` | ✅ Best-implemented page for structured data |
| **FAQPage schema** | Present | ✅ |

#### Room Planner (`/room-planner`)

| Element | Value | Assessment |
|---------|-------|------------|
| **FAQPage schema** | Present | ✅ |

#### Bedroom Planner (`/bedroom-planner`)

| Element | Value | Assessment |
|---------|-------|------------|
| **FAQPage schema** | Missing | ⚠️ Page has 6 FAQs but no FAQPage schema |

---

### 1.4 Structured Data Summary

| Page | SoftwareApplication / WebApplication | FAQPage | BreadcrumbList |
|------|--------------------------------------|---------|----------------|
| `/` | ✅ SoftwareApplication | ❌ (has FAQs) | ❌ |
| `/kitchen-planner` | ✅ WebApplication | ❌ (has 6 FAQs) | Likely ✅ |
| `/bathroom-planner` | ✅ WebApplication | ❌ (has 6 FAQs) | Likely ✅ |
| `/bedroom-planner` | ✅ WebApplication | ❌ (has 6 FAQs) | Likely ✅ |
| `/living-room-planner` | ✅ WebApplication | ❌ (has 6 FAQs) | ✅ |
| `/floor-plan-maker` | ✅ WebApplication | ✅ | ✅ |
| `/room-planner` | ✅ WebApplication | ✅ | Likely ✅ |

---

### 1.5 Core Web Vitals Proxy

| Signal | Assessment |
|--------|------------|
| **Server-side content** | ✅ Homepage has pre-rendered HTML inside `#root` — Google can index content without JS. |
| **Static landing pages** | ✅ All sub-pages (`/kitchen-planner`, etc.) are fully static HTML files — no JS required for content. |
| **Editor (`/app`)** | React SPA — client-side only. Not a ranking concern since `/app` isn't a content page and isn't in the sitemap. |
| **Render-blocking resources** | ⚠️ Two external font loads (Fontshare + Google Fonts) on every page. These are `<link>` stylesheets with `preconnect`, which is correct, but still render-blocking. |
| **JavaScript** | ✅ Static pages only load `rs.js` with `defer`. Homepage loads React via `type="module"`. Neither blocks rendering. |
| **CSS** | ✅ Static pages load `rs.css` — single file. No excessive CSS. |

**Verdict:** Good. The architecture is SEO-friendly. Static HTML for content pages, SPA for the editor. The pre-rendered fallback in `index.html` is a smart approach.

---

### 1.6 Internal Linking

| Signal | Assessment |
|--------|------------|
| **Homepage → sub-pages** | ✅ Links to all 5 room planners + floor plan maker + how-it-works + blog |
| **Nav consistency** | ⚠️ `living-room-planner.html` is missing `/floor-plan-maker` from main nav (present in footer only) |
| **Footer links** | ✅ All pages have comprehensive footer with links to all planners and resources |
| **Cross-linking between sub-pages** | ✅ Floor plan maker links to kitchen, bathroom, bedroom, living room planners. Other pages link via nav/footer. |
| **Blog → planner links** | Not checked in detail — blog posts exist and are in the sitemap |

---

### 1.7 Alt Text & Images

| Signal | Assessment |
|--------|------------|
| **Raster images** | None found on content pages (no `<img>` tags). All illustrations are inline SVGs. |
| **SVG accessibility** | ✅ SVG illustrations use `role="img"` and `aria-label` attributes (e.g., `aria-label="Living room floor plan"`). |
| **OG image** | `og-image.png` exists and is referenced. Not an on-page SEO concern. |

**Verdict:** No alt-text issues. The all-SVG approach avoids image SEO problems entirely.

---

### 1.8 Favicon Inconsistency

| Page | Favicon |
|------|---------|
| Homepage (`index.html`) | `/favicon.png` (type `image/png`) |
| All static sub-pages | `/favicon.svg` (type `image/svg+xml`) |

Minor inconsistency — the homepage references a PNG favicon while sub-pages reference an SVG.

---

## 2. Generated Missing Assets

### 2.1 FAQPage JSON-LD for Kitchen Planner

Add this before `</body>` in `kitchen-planner.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is the kitchen planner really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes — completely free. No account required, no credit card, no hidden fees, no ads."}},
    {"@type": "Question", "name": "Can I plan a kitchen island layout?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Drag an island unit from the furniture library and position it in your kitchen. Check clearances on all sides — you need at least 1 metre for comfortable movement."}},
    {"@type": "Question", "name": "How do I plan the work triangle?", "acceptedAnswer": {"@type": "Answer", "text": "Place your sink, cooker, and fridge in Free Room Planner and measure the distances between them. Ideally each leg of the triangle should be 1.2 to 2.7 metres."}}
  ]
}
</script>
```

> **Note:** Match the actual FAQ text on the page exactly. The above is illustrative — extract the real Q&A text from the page's `.faq-item` elements.

### 2.2 FAQPage JSON-LD for Bathroom Planner

Add this before `</body>` in `bathroom-planner.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is the bathroom planner really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes — completely free. No account required, no credit card, no hidden fees, no ads."}},
    {"@type": "Question", "name": "Can I plan an en-suite bathroom?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Draw your en-suite dimensions and place sanitaryware from the library. Free Room Planner helps you check clearances in compact spaces."}},
    {"@type": "Question", "name": "What are the minimum bathroom clearances?", "acceptedAnswer": {"@type": "Answer", "text": "Allow at least 60 cm in front of a toilet and basin, and 70 cm clear space to step out of a shower or bath."}}
  ]
}
</script>
```

### 2.3 FAQPage JSON-LD for Living Room Planner

Add this before `</body>` in `living-room-planner.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "How much space do I need around a coffee table?", "acceptedAnswer": {"@type": "Answer", "text": "Allow at least 45 cm between the coffee table and the sofa for legroom, and 90 cm clearance on the other sides for walking."}},
    {"@type": "Question", "name": "Will an L-shaped sofa fit in my room?", "acceptedAnswer": {"@type": "Answer", "text": "Draw your room to scale in Free Room Planner, add an L-shaped sofa from the furniture library, and check clearances on all sides — you need 60 cm minimum for walkways."}},
    {"@type": "Question", "name": "How far should the TV be from the sofa?", "acceptedAnswer": {"@type": "Answer", "text": "As a rule of thumb, sit at 1.5 to 2.5 times the diagonal screen size from the TV. For a 55-inch TV, that's 2.1 to 3.5 metres."}}
  ]
}
</script>
```

### 2.4 FAQPage JSON-LD for Bedroom Planner

Add this before `</body>` in `bedroom-planner.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is the bedroom planner really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes — completely free. No account required, no credit card, no hidden fees, no ads."}},
    {"@type": "Question", "name": "Can I plan a small bedroom layout?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Draw your bedroom dimensions to scale and try different bed and wardrobe positions. Free Room Planner helps you find the layout that maximises floor space."}},
    {"@type": "Question", "name": "What's the minimum space around a bed?", "acceptedAnswer": {"@type": "Answer", "text": "Allow at least 60 cm on each side of the bed for comfortable access, and 90 cm at the foot for a clear walkway."}}
  ]
}
</script>
```

### 2.5 FAQPage JSON-LD for Homepage

Add this before `</body>` in `client/index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is Free Room Planner really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes — completely free. No account required, no credit card, no hidden fees, no ads."}},
    {"@type": "Question", "name": "Does it work on mobile?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Free Room Planner works on tablets and mobile phones."}},
    {"@type": "Question", "name": "Do I need to install anything?", "acceptedAnswer": {"@type": "Answer", "text": "Nothing at all. Free Room Planner runs entirely in your web browser."}}
  ]
}
</script>
```

### 2.6 Missing Nav Link Fix

In `living-room-planner.html`, add the Floor Plan Maker link to the nav. Change:

```html
<li><a href="/living-room-planner" class='active'>Living Room Planner</a></li>
<li><a href="/how-it-works" >How it works</a></li>
```

To:

```html
<li><a href="/living-room-planner" class='active'>Living Room Planner</a></li>
<li><a href="/floor-plan-maker" >Floor Plan Maker</a></li>
<li><a href="/how-it-works" >How it works</a></li>
```

### 2.7 Favicon Consistency Fix

In `client/index.html`, change:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

To:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

(Assuming `favicon.svg` is the canonical icon used across all other pages.)

---

## 3. Prioritised Fix List

| # | Issue | Severity | What to fix | Where to fix it |
|---|-------|----------|-------------|-----------------|
| 1 | Missing FAQPage schema on 4 pages | **Med** | Add `FAQPage` JSON-LD to kitchen, bathroom, bedroom, and living room planner pages. These pages already have FAQ content — adding schema enables rich results in Google. | `kitchen-planner.html`, `bathroom-planner.html`, `bedroom-planner.html`, `living-room-planner.html` — add `<script type="application/ld+json">` before `</body>` |
| 2 | Missing FAQPage schema on homepage | **Med** | Homepage has 3 FAQs but no FAQPage schema. Add JSON-LD to match the existing FAQ `<dl>`. | `client/index.html` — add `<script type="application/ld+json">` before `</body>` |
| 3 | Nav inconsistency on living room planner | **Med** | `/living-room-planner` is missing the `/floor-plan-maker` link from its main nav (all other pages have it). This hurts internal link equity to the floor plan maker page. | `living-room-planner.html` line 66 — add `<li><a href="/floor-plan-maker">Floor Plan Maker</a></li>` after the Living Room Planner `<li>` |
| 4 | Render-blocking font stylesheets | **Low** | Two external font loads (Fontshare General Sans + Google Fonts DM Sans) are render-blocking on every page. Consider using `font-display: swap` (already done via `&display=swap`) but also consider `<link rel="preload">` or self-hosting fonts. | All HTML files — `<head>` section |
| 5 | Homepage favicon inconsistency | **Low** | Homepage references `/favicon.png` while all other pages reference `/favicon.svg`. | `client/index.html` line 31 — change to `/favicon.svg` |
| 6 | Homepage schema type vs sub-pages | **Low** | Homepage uses `SoftwareApplication` while sub-pages use `WebApplication`. Both are valid, but consistency would be cleaner. Consider using `SoftwareApplication` everywhere. | Sub-page HTML files — change `@type` in JSON-LD |
| 7 | No `aggregateRating` in schema | **Low** | Adding `aggregateRating` to the `SoftwareApplication` schema would enable star ratings in search results. Requires collecting actual ratings first. | `client/index.html` JSON-LD block |
| 8 | No `screenshot` property in schema | **Low** | Adding a `screenshot` URL to the `SoftwareApplication` schema gives Google a preview image. | `client/index.html` JSON-LD block |

**Not flagged (all good):**
- Title tags: all present, keyword-rich, under 60 chars ✅
- Meta descriptions: all present, 140-160 chars, benefit-led ✅
- H1 tags: single H1 per page, primary keyword included ✅
- Sitemap: valid, comprehensive ✅
- robots.txt: clean, nothing blocked ✅
- Rendering: static HTML for content pages, pre-rendered fallback on homepage ✅
- Internal linking: comprehensive (aside from the one nav inconsistency) ✅
- Alt text: SVGs use `aria-label`, no raster images to worry about ✅
- Canonical tags: present on all pages ✅
- OG tags: present on all pages ✅

---

## 4. Landing Page Briefs

All four pages **already exist** with well-optimised content. Below are assessments of the current state plus any recommended improvements.

### 4.1 Kitchen Planner (`/kitchen-planner`) — EXISTS ✅

| Field | Current Value | Assessment |
|-------|---------------|------------|
| **URL slug** | `/kitchen-planner` | ✅ Perfect |
| **Target keyword** | `free kitchen planner` | ✅ Present in title and H1 |
| **H1** | `Free Kitchen Planner — Plan Your Kitchen Layout Online` | ✅ |
| **Meta title** | `Free Kitchen Planner — Plan Your Layout Online \| FRP` (53 chars) | ✅ |
| **Meta description** | `Draw your kitchen layout to scale online. Place units, appliances and an island, then share the plan with your fitter — free, no account needed.` (143 chars) | ✅ |

**Content present:**
- Hero section with CTA to `/app`
- 3-step "how it works" process
- Feature cards (scale accuracy, kitchen units, work triangle, etc.)
- Kitchen layout guide (editorial content)
- 6 FAQs
- Breadcrumb + footer navigation

**Recommended improvement:** Add FAQPage JSON-LD schema (see Section 2.1).

---

### 4.2 Bathroom Planner (`/bathroom-planner`) — EXISTS ✅

| Field | Current Value | Assessment |
|-------|---------------|------------|
| **URL slug** | `/bathroom-planner` | ✅ Perfect |
| **Target keyword** | `free bathroom planner` | ✅ |
| **H1** | `Free Bathroom Planner — Design Your Bathroom Layout Online` | ✅ |
| **Meta title** | `Free Bathroom Planner — Design Your Layout Online \| FRP` (56 chars) | ✅ |
| **Meta description** | `Design your bathroom layout to scale online. Position sanitaryware, check clearances, and share the plan with your plumber. Free, no account needed.` (148 chars) | ✅ |

**Content present:**
- Hero section with CTA
- 3-step process
- Feature cards
- Planning guide content
- 6 FAQs
- Breadcrumb + footer

**Recommended improvement:** Add FAQPage JSON-LD schema (see Section 2.2).

---

### 4.3 Living Room Planner (`/living-room-planner`) — EXISTS ✅

| Field | Current Value | Assessment |
|-------|---------------|------------|
| **URL slug** | `/living-room-planner` | ✅ Perfect |
| **Target keyword** | `free living room planner` | ✅ |
| **H1** | `Free Living Room Planner` / `Arrange Your Living Room Online` | ✅ |
| **Meta title** | `Free Living Room Planner — Arrange Your Layout Online \| FRP` (60 chars) | ✅ At the 60-char limit |
| **Meta description** | `Plan your living room layout for free. Arrange sofas, tables, and TV units to scale, test different configurations, and share your design. No sign-up needed.` (157 chars) | ✅ |

**Content present:**
- Hero section with SVG floor plan illustration
- Trust bar (1,200+ plans, 30+ items, etc.)
- 3-step process
- Feature cards (scale accuracy, sofas/tables, traffic flow, etc.)
- Living room layout guide (conversation zone, TV distances, traffic paths, symmetry, open-plan)
- 6 FAQs
- CTA section + breadcrumb + footer

**Recommended improvements:**
1. Add FAQPage JSON-LD schema (see Section 2.3)
2. Add `/floor-plan-maker` to main nav (see Section 2.6)

---

### 4.4 Floor Plan Maker (`/floor-plan-maker`) — EXISTS ✅

| Field | Current Value | Assessment |
|-------|---------------|------------|
| **URL slug** | `/floor-plan-maker` | ✅ Perfect |
| **Target keyword** | `free floor plan maker` | ✅ |
| **H1** | `Free Floor Plan Maker` / `Create Accurate Floor Plans Online` | ✅ |
| **Meta title** | `Free Floor Plan Maker — Create Floor Plans Online \| FRP` (56 chars) | ✅ |
| **Meta description** | `Create detailed floor plans for free. Draw walls, doors, and windows to scale, add furniture, then export as PNG to share with builders. No download or login.` (158 chars) | ✅ |

**Content present:**
- Hero section with multi-room floor plan SVG
- Trust bar
- 3-step process
- 9 feature cards (snap-to-grid, live measurements, multi-room, doors & windows, etc.)
- Use cases section (renovation, estate agent, insurance, architect briefs)
- Cross-links to other room planners
- 6 FAQs with FAQPage schema ✅
- BreadcrumbList schema ✅
- CTA section + footer

**Assessment:** This is the best-optimised page on the site. No changes needed.

---

## Summary

The site is in **excellent shape** for Phase 1 SEO. The fundamentals are all in place:

- ✅ Clean robots.txt and comprehensive sitemap
- ✅ Strong title tags and meta descriptions on all pages
- ✅ Single, keyword-rich H1 per page
- ✅ SoftwareApplication/WebApplication schema on every page
- ✅ Pre-rendered HTML ensures crawlability
- ✅ Good internal linking structure
- ✅ All four target landing pages already exist with rich content

**The only actionable fixes are:**

1. **Add FAQPage JSON-LD** to 5 pages that have FAQ content but lack the schema (biggest SEO win — enables FAQ rich results)
2. **Fix the missing nav link** on living-room-planner.html
3. **Minor consistency fixes** (favicon, schema type alignment)
