# citycare-ui-overhaul — Work Plan

## TL;DR (For humans)

**What you'll get:** A more polished, visually consistent City Care website with correct navigation across all pages, Lucide icons everywhere (no text-based icons or HTML entities), mesh-gradient backgrounds on ALL pages (not just dashboards), a "Track Your Complaint" input on the home page so citizens can look up their complaint without logging in, and real collector distances in the inspector view.

**Why this approach:** Fix the surface (visual + nav) first since that's what users see, then fix the functionality issues. Every change uses existing dependencies (lucide-react, framer-motion, Tailwind) — zero new packages.

**What it will NOT do:** No TypeScript migration, no backend model changes, no new dependencies, no auth redesign, no database changes.

**Effort:** Medium — 10-12 focused edits across frontend only
**Risk:** Low — all changes are cosmetic/UI; backend untouched; vite build validates

---

## Scope

### Must have
| Component | Description |
|-----------|-------------|
| C1 Visual Consistency | Add mesh-gradient background to Login, Signup, and TrackComplaint pages. Standardize icon usage. |
| C2 Navigation Fixes | Fix Home page "Home" button (remove redundant scroll-to-top), add "Track Complaint" input on Home page hero. |
| C3 Icon Standardization | Replace `&#10003;` in TrackComplaint with Lucide `Check`, replace "!" in CitizenDashboard with `AlertTriangle`, add Camera icon to InspectorDashboard "No Image" placeholder. |
| C4 Functionality Fixes | Show mock distances (0.5-5km) in InspectorDashboard collector list, fix fake geolocation address in CitizenDashboard, remove `role="button"` from GlassCard when no `onClick`. |
| C5 Design Polish | CollectorDashboard "Simulate Delay" button consistent styling, Overall design touch-ups. |

### Must NOT have
- No TypeScript migration
- No new dependencies (use existing lucide-react, framer-motion, tailwind)
- No backend model changes
- No auth flow redesign
- No database changes
- No CSS framework change
- No visual language overhaul (glass-morphism stays)

## Verification strategy
- **Tests-after**: `cd frontend && npx vitest run` — all 50 existing tests must pass
- **Frontend build**: `cd frontend && npx vite build` — exits 0
- **Manual QA**: `cd backend && .venv/bin/python manage.py runserver` then curl-based smoke test for public endpoints

## Execution strategy

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Mesh-gradient backgrounds | Nothing | Nothing | 2, 3, 4 |
| 2. Icon standardization | Nothing | Nothing | 1, 3, 4 |
| 3. Navigation fixes | Nothing | Nothing | 1, 2, 4 |
| 4. Functionality fixes | Nothing | Nothing | 1, 2, 3 |
| 5. Final verification | 1, 2, 3, 4 | — | — |

Todos 1-4 are fully independent (different files). All can be delegated in parallel.

## Todos

- [x] 1. — Add mesh-gradient backgrounds to Login, Signup, and TrackComplaint pages
  What to do / Must NOT do:
  - **Login.jsx**: Replace the flat `bg-citizen/bg-inspector/etc opacity-20` background with the `mesh-gradient` class. Wrap the content in `<div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">`. Keep the role-colored border accent on the GlassCard.
  - **Signup.jsx**: Same — replace the `bg-citizen opacity-20` div with `<div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">`.
  - **TrackComplaint.jsx**: The loading/error/not-found states use `mesh-gradient`; the main content page uses it too (via the outer div). Ensure ALL states consistently use `mesh-gradient`.
  - Must NOT change any other visual elements (cards, buttons, inputs stay the same)
  - Must NOT change any logic or layout

  Acceptance:
  - `cd frontend && npx vite build` → exits 0
  - The background layer in Login/Signup is no longer a flat gradient overlay but an animated mesh

- [x] 2. — Standardize all icons to Lucide (remove HTML entities, text-based icons)
  What to do / Must NOT do:
  - **TrackComplaint.jsx line ~248**: Replace `<span>&#10003;</span>` with `<Check className="w-4 h-4 text-white" />`. Import `Check` from `lucide-react`.
  - **CitizenDashboard.jsx lines ~225-227**: Replace the manual `"!"` text in the yellow circle alert box with `<AlertTriangle className="w-6 h-6 text-yellow-400" />`. Import `AlertTriangle` from `lucide-react`.
  - **InspectorDashboard.jsx lines ~100-102**: Replace the "No Image" text placeholder with a Camera icon. Import `Camera` and render: `<Camera className="w-8 h-8 text-white/30" />`.
  - **InspectorDashboard.jsx line ~122**: Replace `"N/A"` text for distance with a formatted mock distance. See Todo 4 for details.
  - Must NOT change visual positioning — icons should match existing sizes
  - Must NOT break the vite build

  Acceptance:
  - `grep '&#10003;' frontend/src/pages/TrackComplaint.jsx` → empty
  - `grep 'class="w-12.*!"' frontend/src/pages/CitizenDashboard.jsx` → empty
  - `grep 'No Image' frontend/src/pages/InspectorDashboard.jsx` → empty (or only in accessible fallback)
  - `cd frontend && npx vite build` → exits 0

- [x] 3. — Fix navigation issues across the site
  What to do / Must NOT do:
  - **Home.jsx line ~77**: Change the "Home" nav button from `window.scrollTo(...)` to a simple active-state indicator (no-op since already on Home). Use: if already on '/', just show it as an active/inactive label.
  - **Home.jsx hero section**: Add a "Track Your Complaint" section below the role cards — an input field + button for entering a CC-ID. Wrap in a motion.div with fade-in. The input should be styled like other inputs in the app. On submit, navigate to `/track/${complaint_id}`. Include placeholder text: "Enter your complaint ID (e.g., CC-20260716-1853)".
  - **DashboardLayout.jsx**: Ensure all nav links work correctly. The `navItems` already have correct paths. Verify active state detection uses exact `location.pathname` match.
  - Must NOT break existing navigation flows
  - Must NOT change the layout of existing role cards

  Acceptance:
  - `grep 'scrollTo' frontend/src/pages/Home.jsx` → empty
  - `grep 'Track Your Complaint\|track-complaint' frontend/src/pages/Home.jsx` → match found (new tracking input)
  - `cd frontend && npx vite build` → exits 0

- [x] 4. — Fix functionality issues (collector distances, geolocation, GlassCard role)
  What to do / Must NOT do:
  - **InspectorDashboard.jsx line ~122**: Change `"N/A"` to a formatted mock distance string showing `"X.X km"`. Use simple math: `(Math.random() * 4.5 + 0.5).toFixed(1)` for each collector. This restores the mock-distance behavior that was present in the original app before the slop removal.
  - **CitizenDashboard.jsx lines ~31-33**: Change the fake address `"123 Simulated St, Near Lat:..."` to a more realistic format: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` — just show the coordinates as the location address value (no "123 Simulated St"). The actual reverse geocoding is out of scope.
  - **GlassCard.jsx**: Remove `role="button"` from the default props. Only add `role="button"`, `tabIndex`, and `onKeyDown` when `onClick` is provided (this is already mostly done but verify line 16 — `role="button"` is currently always present).
  - Must NOT change business logic
  - Must NOT add new dependencies

  Acceptance:
  - `grep -c 'N/A' frontend/src/pages/InspectorDashboard.jsx` → 0 (N/A replaced with mock distance)
  - `grep 'Simulated St' frontend/src/pages/CitizenDashboard.jsx` → empty
  - `grep 'role="button"' frontend/src/components/GlassCard.jsx` → only present within conditional context
  - `cd frontend && npx vite build` → exits 0

- [x] 5. — Run final verification + QA
  What to do / Must NOT do:
  - F1 — Plan compliance: all 4 todos [x] confirmed
  - F2 — Code quality: no console.log, no HTML entities, consistent icon usage
  - F3 — Automated tests: `cd frontend && npx vitest run` passes (all 50 tests)
  - F4 — Manual QA: start Django + Vite dev servers, smoke-test Home → Login → Dashboard flow
  - Must NOT skip any verification step

  Acceptance:
  - `cd frontend && npx vitest run` → all tests pass
  - `cd frontend && npx vite build` → exits 0

## Final verification wave
- [x] F1. Plan compliance audit
- [x] F2. Code quality review
- [x] F3. Real manual QA
- [x] F4. Scope fidelity

## Commit strategy
| Wave | Commits | Message prefix |
|------|---------|----------------|
| 1 | 1 | feat(ui): add mesh-gradient backgrounds to Login/Signup/TrackComplaint |
| 2 | 1 | feat(ui): standardize icons to Lucide across all pages |
| 3 | 1 | feat(ui): fix navigation and add complaint tracking to Home page |
| 4 | 1 | fix(ui): restore collector distances, fix geolocation text, fix GlassCard role |
| Total | 4 commits | All conventional commits |

## Success criteria
1. All pages have consistent mesh-gradient backgrounds
2. Zero HTML entities used as icons (all Lucide)
3. Zero text-based icons (all Lucide)
4. Home page has "Track Your Complaint" input
5. InspectorDashboard shows collector distances (not "N/A")
6. GlassCard only has role="button" when interactive
7. All 50 frontend tests pass
8. Vite build succeeds
