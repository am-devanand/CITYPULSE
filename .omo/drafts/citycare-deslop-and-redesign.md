# Draft: citycare-deslop-and-redesign

## Intent & Routing

- **Intent**: UNCLEAR — "the UI and UX is still bad, build a plan to make this an actual usable website" is an open-ended redesign brief
- **Review required**: YES — high-accuracy review (momus + oracle) required automatically per UNCLEAR routing
- **Status**: complete
- **Next action**: execute via `$start-work citycare-deslop-and-redesign`
- **Oracle verification**: PASS (after 4 gaps fixed — Home info modal spec, DashboardLayout nav routes, SLA timer type, serializer test updates)

## Decisions I made for you (exploration-backed best-practice defaults)

### Code Quality / Slop Decisions
1. **Remove `import React` from all .jsx files** — React 17+ automatic JSX transform means it's dead code in 8 files. Exception: `main.jsx` (uses `<React.StrictMode>`) and `ErrorBoundary.jsx` (uses `React.Component`).
2. **Replace 10 `alert()` calls with a framer-motion Toast system** — framer-motion is already a dependency. Inline alert blocks all interaction and provides zero user feedback history.
3. **Replace 17 emoji-as-icons with Lucide SVG icons** — emojis render inconsistently across OS, cannot be styled, fail accessibility. Lucide is lightweight, tree-shakeable, and has icons for every use case in City Care (trash2, search, truck, bar-chart-3, map-pin, etc.).
4. **Collapse 3 action APIViews** (`AssignComplaintView`, `ResolveComplaintView`, `RejectComplaintView`) into `@action` methods on `ComplaintViewSet` — eliminates 3× duplication of the `Complaint.objects.get(id=pk)` pattern and shrinks views.py below 250 LOC.
5. **Remove dead serializers** (`ResolveComplaintSerializer`, `RejectComplaintSerializer`) — they're imported but no view uses them. Tests test them in isolation; those tests should be removed or rewritten to test the actual view behavior.
6. **Remove stale docstrings and lying comments** — e.g., `Serializers adapted for Hybrid SQLite/MongoDB architecture` when MongoDB is dead; `Django settings for citycare project with MongoDB configuration`; section-comment dividers in JSX that just restate the element name.
7. **Fix N+1 queries** — add `select_related('complainant', 'assigned_to', 'assigned_by')` to `ComplaintViewSet.get_queryset` and all 3 action views.
8. **Aggregate `dashboard_stats`** — replace 6 separate `.count()` queries with a single `annotate(Count('id'))` aggregation.
9. **Remove debug print statements** — `print(f"FILES received: {request.FILES.keys()}")` and `print(f"DATA received: {request.data}")` in views.py line 128-129.

### UI/UX Decisions
10. **Add a `ToastProvider` + `useToast` hook** — replaces all 10 `alert()` calls with animated slide-in toasts. Shareable across all dashboards.
11. **Add Lucide React (lucide-react) as SVG icon dependency** — replaces 17 emoji instances. Lightweight (~12KB gzipped), tree-shakeable, works with Tailwind.
12. **Extract shared `DashboardLayout`** — eliminates ~30 lines of duplicated logout/header code per page. Includes role-aware sidebar navigation with links.
13. **Extract 4 shared components**: `StatusBadge`, `StatCard`, `ComplaintCard`, `Toast` — reduces UI duplication and creates a design system foundation.
14. **Public complaint tracking at `/track/:complaint_id`** — no auth required. Shows status timeline, photo, SLA countdown. Uses only the public CC-XXXX complaint ID.
15. **Optional: Add Leaflet map** — the highest-effort item. All researched civic apps use map-first interfaces. Add a basic Leaflet view to InspectorDashboard for map-based queue management.
16. **Keep existing dark glass-morphism theme** — strong brand differentiator. Do NOT redesign the visual language. Focus on information architecture, navigation, states, and accessibility.

### Scope OUT (Must NOT have)
- No TypeScript migration
- No state management library (no Redux, Zustand)
- No backend infrastructure changes (no Docker, no deployment)
- No WebSocket/real-time (no push notifications — add later)
- No third-party auth (no Google/Facebook OAuth)
- No database migration from SQLite
- No i18n/l10n
- No full map implementation (add as Phase 2)
- No changing the glass-morphism visual language
- No removing the ProtectedRoute/ErrorBoundary infrastructure (already added last plan)

## Scope Inventory

### Frontend files to modify (13 files)
| File | LOC | What to do |
|------|-----|-----------|
| `frontend/src/pages/Home.jsx` | 119 | Remove 5 obvious comments, remove dead `import React`, replace 4 emoji icons with Lucide, replace 2 alert() calls with modal/toast |
| `frontend/src/pages/Login.jsx` | 136 | Remove dead `import React`, simplify chained ternary, add `htmlFor`/`id` to labels |
| `frontend/src/pages/CitizenDashboard.jsx` | 265 | Remove dead imports, replace 3 emojis, replace 1 alert(), fix URL.createObjectURL memory leak, add `htmlFor`/`id` |
| `frontend/src/pages/InspectorDashboard.jsx` | 172 | Remove dead imports, replace 3 emojis, replace 1 alert(), make image overlay keyboard-accessible |
| `frontend/src/pages/CollectorDashboard.jsx` | 238 | Remove dead imports, replace 5 emojis, replace 6 alert() calls, extract IIFE, deduplicate execute().catch() pattern |
| `frontend/src/pages/OfficerDashboard.jsx` | 154 | Remove dead imports, remove unused `user` destructure, extract `StatCard`, replace 1 emoji, add loading state rendering |
| `frontend/src/components/GlassCard.jsx` | 17 | Remove dead `import React`, add keyboard accessibility |
| `frontend/src/hooks/useFetch.js` | 43 | Remove mountedRef anti-pattern (modern React doesn't need it) |
| `frontend/src/hooks/usePoll.js` | 77 | Remove obvious comments, simplify useEffect, resetInterval should be auto-called on success |
| `frontend/src/context/AuthContext.jsx` | 60 | Clean up |
| `frontend/src/App.jsx` | 55 | Remove dead `import React`, add ToastProvider |
| `frontend/src/index.css` | 90 | Remove obvious comments, optimize mesh-gradient paint cost |
| `frontend/src/api/index.js` | 56 | Remove section comments |

### Frontend files to create (5 new files)
| File | Purpose |
|------|---------|
| `frontend/src/components/DashboardLayout.jsx` | Shared layout with sidebar navigation + header + logout |
| `frontend/src/components/StatusBadge.jsx` | Reusable status pill with icon + color per status |
| `frontend/src/components/StatCard.jsx` | KPI card with icon, value, label, trend indicator |
| `frontend/src/components/Toast.jsx` | Toast notification system (ToastProvider + useToast) |
| `frontend/src/pages/TrackComplaint.jsx` | Public complaint tracking page by ID |

### Backend files to modify (5 files)
| File | LOC | What to do |
|------|-----|-----------|
| `backend/api/views.py` | 291 | Remove dead imports, remove debug prints, collapse 3 action views into @action, add select_related, aggregate stats, remove comments, shrink below 250 LOC |
| `backend/api/serializers.py` | 68 | Remove dead docstrings, remove unused serializers or wire them in |
| `backend/api/models.py` | 81 | Clean up verbose save() comments, move uuid import to top |
| `backend/api/management/commands/seed_db.py` | 85 | Remove obvious section comments |
| `backend/citycare/settings.py` | 125 | Fix stale docstring |

### Backend endpoints to add
| Endpoint | Purpose |
|----------|---------|
| `GET /api/complaints/lookup/<str:complaint_id>/` | Public complaint lookup by CC-ID (no auth) |

## Approach

### Wave / Dependency Order
| Wave | Description | Depends on |
|------|-------------|-----------|
| **Wave 0** | Lock behavior with regression tests | Nothing |
| **Wave 1** | Backend slop removal (dead code, comments, prints, N+1, aggregation) | Wave 0 |
| **Wave 2** | Frontend slop removal (dead imports, comments, emojis→SVG, alerts→toast) | Wave 0 |
| **Wave 3** | Backend new endpoints (public complaint lookup) | Wave 1 |
| **Wave 4** | Frontend new components (DashboardLayout, StatusBadge, StatCard, Toast, TrackComplaint) | Wave 2 |
| **Wave 5** | Frontend accessibility + UX polish (htmlFor, tabIndex, ARIA, loading states) | Wave 4 |
| **Wave 6** | Final verification (tests pass, code review, QA) | All above |

### Test Strategy
- **Backend**: Existing 112 pytest tests lock all behavior. Add tests for new public lookup endpoint.
- **Frontend**: Existing vitest tests (5 files, 29 tests) lock current behavior. Add tests for new components.

### Verification Strategy
- After each wave: `cd backend && .venv/bin/python -m pytest --cov=api --cov-fail-under=60`
- Frontend: `cd frontend && npx vitest run` (if Node.js available)
- Fidelity check: no TypeScript, no Redux, no Docker after all waves
- Manual: `cd backend && python manage.py runserver` + curl-based smoke test

---

## Research Evidence (from exploration)

### 3 parallel exploration tasks completed

**Task 1 — Frontend audit** (explore agent):
Found: 7 critical UX issues (no complaint tracking, CSRF blocks app, fake GPS data, dev tool exposed, zero accessibility, memory leak, aggressive polling), 14 major issues, 10 minor issues, 26 obvious comments, 10 dead-import Reacts, 17 emoji-as-icons violations, 10 alert()-based UX calls.

**Task 2 — Civic app UX research** (librarian):
Key references: FixMyStreet (map-first reporting, auth-after-submission, public tracking), Swachhata (4-app ecosystem, SLA-based, reopen capability, 93% resolution rate), SeeClickFix (311 CRM, public dashboard, color-coded status), Nivaro (photo-first, auto-categorization), Civic Connect (role-based sidebar, KPI cards, shadcn/ui).

**Task 3 — Backend slop audit** (explore agent):
Found: 30 obvious comments, 4 over-defensive code sites, 7 needless abstractions, 6 dead code sites (including debug prints), 3 duplication patterns (3× complaint lookup, 6× count queries), 3 N+1 query sites, 1 oversized module (views.py at 291 LOC).

### Design retained
Dark glass-morphism theme (index.css, tailwind.config.js) — keep as brand differentiator. Role-based color coding (cyan→citizen, emerald→inspector, amber→collector, purple→officer) is effective and stays.
