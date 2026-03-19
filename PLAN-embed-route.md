# Implementation Plan: Embeddable `/embed` Route

## 1. Codebase Structure Summary

### Architecture
- **Framework**: Vite + React 18 SPA with Express backend (NOT Next.js)
- **Routing**: Client-side via `wouter` — two routes today: `/` (Landing) and `/app` (Editor)
- **Server**: Express serves API routes (`/api/plans`) then falls through to the SPA's `index.html` for all other paths
- **State management**: Custom `useEditor` hook with `useState` + `useRef` undo/redo stacks; auto-saves to `localStorage`
- **Styling**: Tailwind CSS + Radix UI primitives (shadcn/ui)
- **Build**: Vite builds to `dist/public`; Express serves static in production

### Key Components
| File | Role |
|------|------|
| `client/src/pages/Editor.tsx` | The full planner page — header, toolbar, furniture panel, canvas, properties panel, wizards |
| `client/src/components/FloorPlanCanvas.tsx` | Core canvas rendering (walls, furniture, labels, zoom/pan) |
| `client/src/components/EditorToolbar.tsx` | Tool selection bar (wall, select, eraser, etc.) |
| `client/src/components/FurniturePanel.tsx` | Drag-and-drop furniture library sidebar |
| `client/src/components/PropertiesPanel.tsx` | Right sidebar — edit selected item properties |
| `client/src/hooks/use-editor.ts` | All editor state + actions (walls, furniture, labels, undo/redo) |
| `client/src/components/IntentCapture.tsx` | Pre-editor wizard asking user intent (shown once) |
| `client/src/components/FreeRoomPlannerLogo.tsx` | SVG logo component |
| `client/src/components/PerplexityAttribution.tsx` | "Created with Perplexity" footer link |

### What Needs to Be Stripped for Embed
The current `Editor.tsx` includes:
1. **Header bar** (lines 484-587) — logo, room name input, Quick Room button, help dialog, theme toggle
2. **IntentCapture wizard** (lines 473-479) — first-visit intent survey
3. **PerplexityAttribution** (lines 755-757) — will be replaced by "Powered by" badge
4. **MobileWizard / DesktopWizard** — onboarding overlays
5. **RoomGeneratorWizard** — "Quick Room" AI generation dialog

The embed must keep: EditorToolbar, FurniturePanel, FloorPlanCanvas, PropertiesPanel.

### Risks and Blockers
- **No blockers identified.** The editor components are well-separated from the site shell.
- `useEditor` hook is self-contained — no global context providers needed beyond `QueryClientProvider` and `TooltipProvider` (both are lightweight wrappers).
- `localStorage` auto-save uses a fixed key (`freeroomplanner-autosave`). If the same user visits the main site AND an embed, they'd share state. **Mitigation**: use a separate localStorage key for embed (e.g. `freeroomplanner-embed-autosave`).
- `html2canvas` is imported dynamically in Editor.tsx for PNG export. This is fine to keep in the embed.
- The `trackEvent` analytics helper uses `window.gtag` — it will silently no-op if gtag isn't loaded, so no breakage.

---

## 2. Recommended File and Folder Structure

```
client/src/
├── pages/
│   ├── Editor.tsx          (existing — unchanged)
│   ├── Landing.tsx         (existing — unchanged)
│   ├── Embed.tsx           (NEW — embed page component)
│   └── not-found.tsx       (existing)
├── components/
│   ├── PoweredByBadge.tsx  (NEW — tamper-resistant badge)
│   └── ...                 (existing — no changes)
├── lib/
│   ├── embed-params.ts     (NEW — parse & validate embed URL params)
│   └── ...                 (existing — no changes)
└── App.tsx                 (MODIFIED — add /embed route)
```

**Server-side** — no new files needed. The Express catch-all already serves `index.html` for any unknown path, so `/embed` will resolve to the SPA and wouter will handle it.

**Optional future addition**: `server/routes.ts` could gain a `POST /api/embed-events` endpoint for server-side partner tracking, but this is not required for v1 (see section 5).

---

## 3. Tamper-Resistant "Powered by freeroomplanner.com" Badge

### The Threat Model
An embedding site could try to:
1. Use CSS (`iframe { }` or injected stylesheets) to hide the badge
2. Use `sandbox` attribute on the iframe to restrict behaviour
3. Pass URL params to disable the badge
4. Use `postMessage` to manipulate the embed DOM

### Defence-in-Depth Strategy

#### Layer 1: Shadow DOM Isolation
Render the badge inside a Web Component with a **closed Shadow DOM**. This means:
- External CSS from the parent page or iframe attributes **cannot reach** elements inside the shadow root
- `document.querySelector` from outside the shadow root **cannot select** badge elements
- The badge's styles are fully encapsulated

```
PoweredByBadge.tsx will:
1. Use useRef + useEffect to attach a closed shadow root to a container div
2. Render the badge HTML + inline styles inside the shadow root
3. The shadow root is mode: "closed" — no external JS can access shadowRoot
```

#### Layer 2: Periodic Integrity Checks
A `setInterval` (every 2 seconds) will verify:
- The badge container element still exists in the DOM
- It has non-zero dimensions (`offsetWidth > 0`, `offsetHeight > 0`)
- It is not hidden via `display: none`, `visibility: hidden`, or `opacity: 0` (check `getComputedStyle` on the host element)
- Its `position: fixed` and `z-index` are intact

If any check fails: overlay the entire canvas with a semi-transparent blocker and message ("This embed requires the Powered by freeroomplanner.com badge to be visible"). The planner becomes unusable until the badge is restored.

#### Layer 3: CSS Hardening on the Host Element
The outer `<div>` that hosts the shadow DOM will have:
- `position: fixed; bottom: 12px; right: 12px; z-index: 2147483647` (max z-index)
- All styles applied via `element.style` (inline), which has highest CSS specificity
- `!important` on critical properties as extra insurance
- `pointer-events: auto` so the link remains clickable even if a parent sets `pointer-events: none`

#### Layer 4: No URL Parameter to Disable
The badge component accepts zero props that control visibility. The `embed-params.ts` parser will explicitly ignore any parameter like `hide_badge`, `no_badge`, etc. The badge is unconditionally rendered.

#### Layer 5: Mutation Observer
Attach a `MutationObserver` on the badge host element to detect:
- Attribute changes (e.g. `style`, `class`, `hidden`)
- Removal from the DOM

On detection: immediately re-insert and/or reset styles, plus trigger the blocker overlay if repeated tampering is detected.

### Badge Design
- Small pill/chip: "Powered by freeroomplanner.com" with the FreeRoomPlannerLogo SVG
- Semi-transparent dark background, white text
- Fixed bottom-right corner
- Clickable — opens `https://freeroomplanner.com?ref=PARTNER_ID&utm_source=embed` in `_blank`

---

## 4. URL Parameters — Full List

All parameters are read from the URL query string on the `/embed` route.

| Parameter | Required | Type | Validation | Default |
|-----------|----------|------|------------|---------|
| `partner` | Yes | `string` | Alphanumeric + hyphens + underscores, max 64 chars. Reject if missing or invalid — show an error state. | — |
| `brand_color` | No | `string` | Must match `/^[0-9a-fA-F]{3,8}$/` (hex without `#`). Applied as CSS variable `--embed-brand-color`. | Theme default |
| `logo_url` | No | `string` | Must be a valid `https://` URL. Sanitised with `new URL()` constructor; reject `javascript:`, `data:`, etc. Rendered as an `<img>` in the header area only. | None |
| `dark` | No | `"0"` or `"1"` | Force light or dark mode. If absent, use system preference. | System pref |
| `units` | No | `"m"` / `"cm"` / `"mm"` / `"ft"` | Set default unit system. | `"m"` |
| `hide_toolbar` | No | `"0"` or `"1"` | Hide the toolbar for a view-only / minimal embed. | `"0"` |

### Sanitisation approach
- All params parsed in `client/src/lib/embed-params.ts` via a single `parseEmbedParams(searchString)` function
- Uses `URLSearchParams` for parsing
- Each value validated with a dedicated check; invalid values fall back to defaults
- `logo_url` is additionally checked: only `https://` protocol, must pass `new URL()` without throwing
- No parameter can affect the PoweredByBadge — it reads nothing from URL params

### Where brand parameters apply
- `brand_color`: sets a CSS custom property on the embed root. Applied to the thin top accent bar (optional) and any partner branding area — **never** to the badge, toolbar, or canvas
- `logo_url`: rendered in a small branding strip above or beside the toolbar — **never** overlapping the badge

---

## 5. Partner ID Tracking

### V1: Client-Side (Ship First)
- The `partner` ID is read from the URL and passed to `trackEvent()` (Google Analytics) with every significant event:
  - `embed_loaded` — fired once on mount, includes `partner`, `referrer`, `timestamp`
  - `room_plan_saved` — fired on PNG export, includes `partner`
  - `embed_badge_clicked` — fired on badge click, includes `partner`
- The badge link already carries `?ref=PARTNER_ID&utm_source=embed`, so GA will attribute landing page visits to the partner via UTM params

### V2: Server-Side (Follow-Up)
- Add a `POST /api/embed-events` endpoint that accepts `{ partner: string, event: string, metadata?: object }`
- Store in a new `embed_events` table (partner_id, event_type, created_at, metadata JSONB)
- This gives first-party data independent of GA and allows building a partner dashboard later
- The client fires a `navigator.sendBeacon()` call on `embed_loaded` so even if the user leaves immediately, the event is captured

### Implementation Note
For V1, we do NOT need a new database table or API endpoint. We simply enrich existing `trackEvent` calls with the partner dimension.

---

## 6. Prioritised Build Order

### Phase 1 — Core Embed (MVP)
1. **`client/src/lib/embed-params.ts`** — URL parameter parsing and validation
2. **`client/src/pages/Embed.tsx`** — New page component: stripped-down editor (no header, no intent capture, no onboarding wizards, no PerplexityAttribution) + partner branding area
3. **`client/src/App.tsx`** — Add `/embed` route
4. **`client/src/components/PoweredByBadge.tsx`** — Shadow DOM badge with integrity checks
5. **Partner tracking via `trackEvent`** — Add `embed_loaded`, `embed_badge_clicked` events

### Phase 2 — Hardening & Polish
6. **Integrity enforcement** — MutationObserver + setInterval checks + blocker overlay
7. **Brand parameter application** — `brand_color` CSS variable, `logo_url` image rendering
8. **Separate localStorage key** for embed auto-save (`freeroomplanner-embed-autosave`)
9. **`X-Frame-Options` / CSP headers** — The main site should send `X-Frame-Options: DENY` to prevent framing, but the `/embed` route must **not** send this header (or send `ALLOW-FROM` / rely on CSP `frame-ancestors`). Adjust in Express middleware.

### Phase 3 — Server-Side Tracking (Future)
10. **`POST /api/embed-events`** endpoint
11. **`embed_events` database table** via Drizzle migration
12. **Partner dashboard** (out of scope for now)

---

## 7. Changes Needed to Existing Components

### Must Change
| File | Change |
|------|--------|
| `client/src/App.tsx` | Add `<Route path="/embed" component={Embed} />` inside the `<Switch>` |

### No Changes Required
The following existing components will be **reused as-is** in the embed page:
- `FloorPlanCanvas` — no modifications needed
- `EditorToolbar` — no modifications needed
- `FurniturePanel` — no modifications needed
- `PropertiesPanel` — no modifications needed
- `useEditor` hook — no modifications needed (the embed page will pass a different localStorage key or we can add an optional parameter)
- `FreeRoomPlannerLogo` — reused inside the PoweredByBadge

### Considered But Not Needed
- No changes to `server/routes.ts` — the SPA catch-all handles `/embed`
- No changes to `server/static.ts` — same reason
- No changes to `vite.config.ts` — single SPA entry point is sufficient
- No new npm dependencies required — Shadow DOM APIs are native, `MutationObserver` is native

### Optional Refactor (Recommended but not blocking)
- Extract the editor "core" (toolbar + canvas + panels) from `Editor.tsx` into a shared `EditorCore.tsx` component that both `Editor.tsx` and `Embed.tsx` can use. This avoids duplicating ~200 lines of wiring code (all the `useCallback` handlers for copy/paste/duplicate/delete/rotate/etc.). **However**, this is a refactor of existing code and can be done in Phase 1 or deferred — the embed can initially copy the relevant wiring from Editor.tsx and we can DRY it up afterwards.
