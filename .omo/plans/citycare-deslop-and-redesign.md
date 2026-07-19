# citycare-deslop-and-redesign — Work Plan

## TL;DR (For humans)

**What you'll get:** A production-quality, usable civic waste management web app. This plan removes all AI slop from the current codebase (dead code, debug prints, N+1 queries, alert()-based UX, emoji-as-icons, obvious comments, oversized modules), then adds the minimum UI infrastructure to make it feel like an actual product: shared component system, toast notifications, SVG icons, public complaint tracking by ID, role-aware sidebar navigation, and accessibility basics.

**Why this approach:** Two-phase — clean first (you can't build on slop), then build the UX layer (components > pages > accessibility). The backend cleanup also improves performance (N+1 fixes collapse 6 queries into 1, `select_related` eliminates N+3 patterns per complaint).

**What it will NOT do:** No TypeScript, no Redux/Zustand, no Docker/CI, no WebSocket, no i18n, no map implementation, no auth-flow redesign (report-first-auth-later is Phase 2), no visual language redesign (glass-morphism stays).

**Effort:** Large — 15-20 todos across 6 waves

---

## Scope

### Must have

| Component | Description |
|-----------|-------------|
| C0 Backend Slop Removal | Remove debug `print()`, dead imports (`default_storage`, `ContentFile`), dead serializers (`ResolveComplaintSerializer`, `RejectComplaintSerializer`), stale docstrings, obvious section comments. Add `select_related` to ComplaintViewSet. Aggregate `dashboard_stats` into single query. Collapse 3 action APIViews into `@action` methods. Remove `mountedRef` anti-pattern from useFetch. |
| C1 Frontend Slop Removal | Remove dead `import React` from 8 files (keep main.jsx + ErrorBoundary.jsx). Remove 26 obvious comments (section dividers, restating element names). Remove debug/leftover patterns. Fix URL.createObjectURL memory leak. Remove unused `user` destructure in OfficerDashboard. |
| C2 Emoji → SVG Icon Migration | Add `lucide-react` dependency. Replace 17 emoji instances with Lucide icons across 5 files. Remove emoji alt-text fallbacks. |
| C3 Alert → Toast Migration | Create `Toast` component + `ToastProvider` + `useToast` hook. Replace 10 `alert()` calls across 4 files with toast notifications. Handle: form validation errors, API failures, success confirmations, info display. |
| C4 New Components | Extract `DashboardLayout` (shared sidebar + header + logout). Extract `StatusBadge` (reusable status pill). Extract `StatCard` (KPI card with icon). These eliminate ~80 lines of duplicated code across dashboards. |
| C5 Public Complaint Tracking | Add backend endpoint `GET /api/complaints/lookup/<str:complaint_id>/` (no auth). Create frontend page `/track/:complaint_id` showing: status timeline, photos, SLA countdown. |
| C6 Accessibility Basics | Add `htmlFor`/`id` to all form labels. Add `role="button"`/`tabIndex`/`onKeyDown` to GlassCard clickable. Add `aria-label` to icon buttons. Add keyboard-accessible image overlays in InspectorDashboard. |
| C7 Frontend Test Coverage | Add vitest tests for: Toast component, DashboardLayout, StatusBadge, StatCard, TrackComplaint page, useToast hook. |

### Must NOT have (guardrails)

- No TypeScript migration — all files stay `.jsx` / `.py`
- No state management library — no Redux, Zustand, Recoil
- No Docker/CI/CD — no GitHub Actions, Dockerfile, nginx
- No WebSocket/real-time — no push notifications
- No i18n/l10n
- No database migration from SQLite
- No full Leaflet/Mapbox map implementation (Phase 2)
- No auth flow redesign (report-first-auth-later is Phase 2)
- No visual language change — glass-morphism stays
- No removal of ProtectedRoute, ErrorBoundary, usePoll, useAuth (already production-hardened)

## Verification strategy

- **Tests-after**: Wave 0 locks with existing tests. Each wave runs `cd backend && .venv/bin/python -m pytest --cov=api --cov-fail-under=60` to confirm no regression.
- **Frontend verification**: `cd frontend && npx vitest run` when Node.js available.
- **Manual QA**: Curl-based smoke test of the full flow: guest submit → inspector assign → collector resolve → officer stats.
- **Quality gates** per remove-ai-slops: regression tests (green), lint (0 new errors), typecheck (N/A for .jsx), unit tests (green), security scan (N/A).

### Final Verification Results (Todo 16)

| Check | Result | Evidence |
|-------|--------|----------|
| F1 — Plan compliance | ✅ | All 16 todos [x] confirmed |
| F2 — Code quality | ✅ | No console.log, alert(), emoji icons, or dead React imports in production code |
| F3 — Automated tests | ✅ | Backend: 108 passed, 93.8% coverage; Frontend: 50 tests, 10 files |
| F4 — Manual QA | ✅ | Public lookup works (CC-20260716-1853 → RESOLVED, no sensitive fields); 404 for nonexistent; Guest login works; Stats accessible; Complaint submission works |
| F5 — Scope fidelity | ✅ | No TypeScript, Redux, Docker, PWA, or WebSocket introduced |

## Execution strategy

### Wave dependency matrix

| Wave | Description | Depends on |
|------|-------------|-----------|
| Wave 0 | Lock behavior with tests | Nothing |
| Wave 1 | Backend slop + N+1 + aggregation | Wave 0 |
| Wave 2 | Frontend slop + emojis→SVG + alerts→Toast | Wave 0 |
| Wave 3 | Public complaint tracking endpoint + page | Wave 1 |
| Wave 4 | New shared components (DashboardLayout, StatusBadge, StatCard) | Wave 2 |
  | Wave 5 | Accessibility + frontend tests | Wave 4, Wave 3 (TrackComplaint.test.jsx depends on Wave 3's TrackComplaint.jsx) |
| Wave 6 | Final verification + QA | All above |

## Todos

> Implementation + Test = ONE todo. Never separate.

### Wave 0 — Lock behavior (0.5 todos)

- [x] 0. — Run existing tests to establish green baseline
  What to do: Run `cd backend && .venv/bin/python -m pytest --cov=api --cov-fail-under=60`. Confirm 112 tests pass with 94.41% coverage. This is the locked behavior guarantee.
  Acceptance: All tests pass.
  Commit: N (no code change)

### Wave 1 — Backend slop removal (4 todos)

- [x] 1. — Backend: Remove dead code, debug prints, and stale docstrings
  What to do / Must NOT do:
  - `backend/api/views.py`: Remove line 7 `from django.core.files.storage import default_storage`, line 8 `from django.core.files.base import ContentFile`, line 128-129 `print(f"FILES received: ...")` and `print(f"DATA received: ...")`
  - `backend/api/views.py`: Remove lines 3, 27 (commented-out MongoDB artifacts); remove 30-31, 54, 63, 93, 101-104, 140, 143, 155, 166, 176, 255, 265 (obvious comments/section dividers)
  - `backend/api/serializers.py`: Remove lines 57, 62, 67 (docstrings that restate class names); fix line 2-3 lying docstring "Hybrid SQLite/MongoDB"
  - `backend/api/models.py`: Clean up lines 72-79 verbose save() comments to 1 line
  - `backend/citycare/settings.py`: Fix line 2 lying docstring "with MongoDB configuration"
  - `backend/api/management/commands/seed_db.py`: Remove lines 15, 39 obvious section comments
  - Must NOT change any business logic — only comments, prints, and unused imports
  - Must NOT break any existing test
  - Must NOT remove `from rest_framework import serializers` import

  References: Full line numbers in exploration report.
  Acceptance:
  - `grep -r 'FILES received\|DATA received' backend/api/views.py` → empty
  - `grep -r 'default_storage\|ContentFile' backend/api/views.py` → empty
  - `grep 'Hybrid SQLite/MongoDB' backend/api/serializers.py` → empty
  - `grep 'MongoDB configuration' backend/citycare/settings.py` → empty
  - `cd backend && .venv/bin/python manage.py check` → exits 0
  - `cd backend && .venv/bin/python -m pytest` → 112 passed (no regressions)
  Commit: Y | chore: remove dead code, debug prints, and stale docstrings from backend

- [x] 2. — Backend: Add select_related to fix N+1 queries in Complaint views
  What to do / Must NOT do:
  - `backend/api/views.py line 113-124`: Modify `ComplaintViewSet.get_queryset` to add `.select_related('complainant', 'assigned_to', 'assigned_by')`
  - `backend/api/views.py`: In `AssignComplaintView`, `ResolveComplaintView`, `RejectComplaintView`, change `Complaint.objects.get(id=pk)` to `Complaint.objects.select_related('complainant', 'assigned_to', 'assigned_by').get(id=pk)` — OR better, collapse these views into `@action` methods (todo 1.3) where the queryset is already configured.
  - Must NOT change any response shape
  - Must NOT add `select_related` on non-existent relations

  Acceptance:
  - `grep -c 'select_related' backend/api/views.py` → ≥ 2 (get_queryset + at least one action)
  - `cd backend && .venv/bin/python -m pytest` → 112 passed
  Commit: Y | perf: add select_related to fix N+1 queries in complaint views

- [x] 3. — Backend: Collapse 3 action APIViews into ComplaintViewSet @action methods
  What to do / Must NOT do:
  - Move `AssignComplaintView`, `ResolveComplaintView`, `RejectComplaintView` logic into `ComplaintViewSet` as `@action(detail=True, methods=['post'])` methods: `assign`, `resolve`, `reject`
  - Remove the three standalone view classes
  - Update `backend/api/urls.py`: Replace 3 standalone paths with ViewSet router actions (DRF router handles `/{pk}/assign/`, `/{pk}/resolve/`, `/{pk}/reject/` automatically via `@action`)
  - The `@action` methods use `self.get_object()` instead of `Complaint.objects.get(id=pk)`, which already includes `select_related` from the updated `get_queryset`
  - Must NOT change URL structure — endpoints remain `/api/complaints/{pk}/assign/`, etc.
  - Must NOT change response shape
  - Must verify: `complaint_id` → `pk` rename from previous plan is already applied

  Acceptance:
  - `grep -c 'class AssignComplaintView\|class ResolveComplaintView\|class RejectComplaintView' backend/api/views.py` → 0
  - `grep '@action' backend/api/views.py | grep -c 'detail=True'` → ≥ 3
  - `cd backend && .venv/bin/python -m pytest` → 112 passed
  - `grep -c 'self.get_object()' backend/api/views.py` → ≥ 3 (action methods use get_object)
  Commit: Y | refactor: collapse action views into ComplaintViewSet @action methods

- [x] 4. — Backend: Aggregate dashboard_stats into single query + remove unused serializers
  What to do / Must NOT do:
  - Replace 6× `Complaint.objects.filter(status='X').count()` in `dashboard_stats` with:
    ```python
    from django.db.models import Count
    status_counts = Complaint.objects.values('status').annotate(count=Count('id'))
    counts = {item['status']: item['count'] for item in status_counts}
    stats = {status: counts.get(status, 0) for status in ['PENDING', 'ASSIGNED', 'RESOLVED', 'REJECTED', 'ESCALATED']}
    stats['active'] = stats['PENDING'] + stats['ASSIGNED']
    stats['total'] = Complaint.objects.count()
    ```
  - Remove unused serializers: `ResolveComplaintSerializer`, `RejectComplaintSerializer` from `serializers.py` — OR wire them into the `@action` methods if they add value (decision: remove, since views read directly from `request.FILES` and `request.data`)
  - **⚠️ Update test files** (both files):
    1. `backend/api/tests/test_views_actions.py` — remove or rewrite any tests that import or reference `ResolveComplaintSerializer` / `RejectComplaintSerializer`. The file has a comment at line 154: *"The view ignores RejectComplaintSerializer (dead code)"* — that test should be removed or replaced with a test that verifies the actual view's behavior (resolve/reject directly via POST to the @action endpoints).
    2. `backend/api/tests/test_serializers.py` — remove `TestResolveComplaintSerializer` and `TestRejectComplaintSerializer` test classes (around lines 135-157) and remove the imports of those serializers (lines 14-15). These tests will fail if the serializers no longer exist.
  - Must NOT change the response JSON structure of `/api/stats/`

  Acceptance:
  - `grep -c '\.filter(status=' backend/api/views.py || true` → the dashboard_stats method has 0 `.filter(status=` calls (now uses single `values('status').annotate(...)` query); any remaining `.filter(status=` in other views (e.g. list filters) is expected and NOT removed
  - `grep 'ResolveComplaintSerializer\|RejectComplaintSerializer' backend/api/serializers.py` → empty
  - `grep 'ResolveComplaintSerializer\|RejectComplaintSerializer' backend/api/views.py` → empty (import line removed)
  - `cd backend && .venv/bin/python -m pytest` → all tests pass
  Commit: Y | perf: aggregate dashboard_stats into single query, remove unused serializers

### Wave 2 — Frontend slop removal (3 todos)

- [x] 5. — Frontend: Remove dead imports and obvious comments from all page files
  What to do / Must NOT do:
  - Remove `import React` from: Home.jsx, Login.jsx, CitizenDashboard.jsx, InspectorDashboard.jsx, CollectorDashboard.jsx, OfficerDashboard.jsx, GlassCard.jsx, App.jsx (keep in main.jsx and ErrorBoundary.jsx)
  - Remove `useEffect` from CitizenDashboard.jsx and CollectorDashboard.jsx if unused
  - Remove section-obvious comments (26 instances): `{/* Sticky Navbar */}`, `{/* Hero Section */}`, `{/* Footer */}`, section comments in CSS, `// Auth` / `// Users` / `// Complaints` in api/index.js
  - Remove `const { user } = useAuth()` from OfficerDashboard.jsx (user never used)
  - Must NOT change any logic or rendering
  - Must NOT remove comments that explain WHY (only ones that restate WHAT)

  References: Frontend exploration report — 26 obvious comments, 10 dead imports, 1 unused destructure.
  Acceptance:
  - `cd frontend && npx vite build` → exits 0 (when Node.js available)
  - `grep -c "import React from 'react'" frontend/src/pages/*.jsx frontend/src/components/GlassCard.jsx frontend/src/App.jsx` → 0
  - `grep '{/\*.*\*/}' frontend/src/pages/*.jsx` → only legitimate comments remain
  Commit: Y | chore: remove dead imports and obvious comments from frontend

- [x] 6. — Frontend: Replace 17 emoji instances with Lucide SVG icons
  What to do / Must NOT do:
  - Add `lucide-react` to `frontend/package.json` devDependencies
  - Replace emojis with Lucide components in these locations:
    | File | Emoji | Lucide icon |
    |------|-------|------------|
    | Home.jsx (role cards) | 🏠 🔍 🚛 📊 | `Home`, `Search`, `Truck`, `BarChart3` |
    | CitizenDashboard.jsx | ✅ 📍 📷 | `CheckCircle2`, `MapPin`, `Camera` |
    | InspectorDashboard.jsx | 🎉 🔥 ⚠️ | `PartyPopper`, `Flame`, `AlertTriangle` |
    | CollectorDashboard.jsx | ⚠️ ✨ 📍 ✗ ✓ | `AlertTriangle`, `Sparkles`, `MapPin`, `X`, `Check` |
    | OfficerDashboard.jsx | 🚛 | `Truck` |
  - Maintain emoji as fallback only when icon fails (unlikely)
  - Use Tailwind className on icons: `className="w-5 h-5 inline-block"`
  - Must NOT change layout or spacing — icons should match emoji sizing
  - Must NOT remove any emoji that carries semantic meaning without replacement (e.g., in alert/error contexts, keep text equivalent)

  Acceptance:
  - `grep 'lucide-react' frontend/package.json` → match found
  - `grep -r '🏠\|🔍\|🚛\|📊\|✅\|📍\|📷\|🎉\|🔥\|⚠️\|✨\|✗\|✓' frontend/src/pages/` → 0
  - `grep -c 'from.*lucide-react' frontend/src/pages/*.jsx` → ≥ 5 (one per page)
  - `cd frontend && npx vite build` → exits 0 (when Node.js available)
  Commit: Y | feat(ui): replace emoji-as-icons with Lucide SVG icons

- [x] 7. — Frontend: Replace 10 alert() calls with Toast notification system
  What to do / Must NOT do:
  - Create `frontend/src/components/Toast.jsx`:
    - `ToastProvider` context (wraps app, renders toast container)
    - `useToast()` hook returning `{ toast: (message, type) => void }`
    - `type`: `'success'`, `'error'`, `'info'`, `'warning'`
    - Animated slide-in from top-right using framer-motion
    - Auto-dismiss after 4 seconds, manual dismiss via X button
    - Max 3 visible toasts, queue overflow
  - Update `App.jsx`: wrap `<AuthProvider>` with `<ToastProvider>`
  - Replace `alert()` calls using TWO separate UI patterns:
    - **Toast** (auto-dismissing top-right notification, 4s) → for error/warning/success feedback and simulation info
    - **InfoDrawer** (persistent slide-out panel) → for Home.jsx "Waste Info" and "Contact" buttons (rich, selectable content)
  - 8 alert() calls → Toast:
    | File | Line | Context | Toast type |
    |------|------|---------|-----------|
    | CitizenDashboard.jsx | 36 | Geolocation failure | `error` |
    | InspectorDashboard.jsx | 43 | Assign failure | `error` |
    | CollectorDashboard.jsx | 38 | No photo | `warning` |
    | CollectorDashboard.jsx | 50 | Resolve failure | `error` |
    | CollectorDashboard.jsx | 56 | No reason | `warning` |
    | CollectorDashboard.jsx | 65 | Reject failure | `error` |
    | CollectorDashboard.jsx | 85 | Simulation success | `info` |
    | CollectorDashboard.jsx | 90 | Simulation failure | `error` |
  - 2 Home.jsx alert() calls → InfoDrawer (NOT Toast):
    | File | Line | Context | InfoDrawer content |
    |------|------|---------|------------------|
    | Home.jsx | 54 | Waste info button | Static waste segregation guidelines text |
    | Home.jsx | 55 | Contact button | Phone/email contact info + office hours |
  - Create `frontend/src/components/InfoDrawer.jsx`:
    - Slide-out panel from the right edge (right drawer pattern, NOT centered modal)
    - Uses `framer-motion` `AnimatePresence` for slide-in/out animation (300ms ease)
    - 400px wide on desktop, full-width on mobile (<768px)
    - Renders content as formatted, selectable text paragraphs (user can copy text)
    - Includes a "Copy to clipboard" button at the bottom using `navigator.clipboard.writeText()`
    - Close via X button in top-right corner, or backdrop click, or Escape key
    - Props: `{ isOpen, onClose, title, content }` — content is structured as `{ heading, body, items?: {label, value}[] }`
    - File location: `frontend/src/components/InfoDrawer.jsx`
    - Must NOT add any dependencies — pure React + framer-motion (already installed)
  - Must NOT change any business logic or flow
  - Must NOT add framer-motion as dependency (already in package.json)

  Acceptance:
  - `ls frontend/src/components/Toast.jsx` → file exists
  - `grep 'ToastProvider' frontend/src/App.jsx` → match found
  - `grep -r 'alert(' frontend/src/pages/` → 0 (no remaining alert calls)
  - `grep 'useToast' frontend/src/pages/*.jsx` → 4 matches (Home, Citizen, Inspector, Collector)
  - `cd frontend && npx vite build` → exits 0 (when Node.js available)
  Commit: Y | feat(ui): replace alert() with Toast notification system

### Wave 3 — Public complaint tracking (2 todos)

- [x] 8. — Backend: Add public complaint lookup endpoint
  What to do / Must NOT do:
  - Add to `backend/api/views.py`:
    ```python
    class PublicComplaintLookupView(APIView):
        permission_classes = [AllowAny]
        authentication_classes = []

        def get(self, request, complaint_id):
            try:
                complaint = Complaint.objects.select_related(
                    'complainant', 'assigned_to', 'assigned_by'
                ).get(complaint_id=complaint_id)
                return Response(PublicComplaintSerializer(complaint).data)
            except Complaint.DoesNotExist:
                return Response(
                    {'error': 'Complaint not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
    ```
  - Add to `backend/api/urls.py`: `path('complaints/lookup/<str:complaint_id>/', views.PublicComplaintLookupView.as_view(), name='complaint-lookup')`
  - Add `PublicComplaintSerializer` to `backend/api/serializers.py` with **explicit `fields` tuple** containing ONLY public-safe fields:
    ```python
    class PublicComplaintSerializer(serializers.ModelSerializer):
        class Meta:
            model = Complaint
            fields = (
                'complaint_id', 'status', 'description', 'location_address',
                'latitude', 'longitude', 'before_image', 'after_image',
                'created_at', 'updated_at', 'urgency', 'category',
            )
    ```
    Must NOT include: `complainant`, `assigned_to`, `assigned_by`, `force_escalate`, `escalated_at`, `rejected_reason`, `complainant_username`, `assigned_to_username`, `assigned_by_username`.
  - Use `PublicComplaintSerializer(complaint).data` in the lookup view instead of the full `ComplaintSerializer`
  - Must NOT expose user email/phone — PublicComplaintSerializer should only expose public-safe fields
  - Must NOT require authentication
  - Must return 404 for non-existent IDs (not 403 or 500)

  References: Public tracking pattern from FixMyStreet, Swachhata (lookup by reference ID).
  Acceptance:
  - `curl -s http://localhost:8000/api/complaints/lookup/CC-20260716-1853/ | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','FAIL'))"` → prints `PENDING` or similar
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/complaints/lookup/NONEXISTENT/` → 404
  - `cd backend && .venv/bin/python -m pytest` → 112+ passed
  Commit: Y | feat(api): add public complaint lookup endpoint by CC-ID

- [x] 9. — Frontend: Create public complaint tracking page
  What to do / Must NOT do:
  - Create `frontend/src/pages/TrackComplaint.jsx`:
    - Route: `/track/:complaint_id`
    - Fetches complaint by CC-ID from new public endpoint
    - Displays status timeline: SUBMITTED → ASSIGNED → RESOLVED with animated connector
    - Shows before/after photos with comparison
    - Shows SLA countdown timer: **Static** calculation rendered once on page load — parse the ISO 8601 `created_at` string via `new Date(created_at).getTime()`, then `Math.max(0, 16*60*60*1000 - (Date.now() - created_at_ms)) / 3600000` displayed as "X hours remaining". No live ticking countdown (keeps it simple — user can refresh for updated time). Renders red if <2h, yellow if <6h, green otherwise.
    - Shows complaint_id, location address, status badge
    - "Report an issue" CTA at bottom to navigate to home
    - Clean, minimal design — no glass card nesting, single column layout
  - Add route to `frontend/src/App.jsx`: `<Route path="/track/:complaint_id" element={<TrackComplaint />} />`
  - Add `lookupComplaint = (complaint_id) => api.get(\`/complaints/lookup/${complaint_id}/\`)` to `frontend/src/api/index.js`
  - Must NOT require authentication
  - Must show loading state while fetching
  - Must show 404 state if ID not found
  - Must NOT expose complainant name/email (only public-safe fields)

  Acceptance:
  - `ls frontend/src/pages/TrackComplaint.jsx` → file exists
  - `grep '/track/' frontend/src/App.jsx` → match found
  - `grep 'lookupComplaint' frontend/src/api/index.js` → match found
  - `cd frontend && npx vite build` → exits 0 (when Node.js available)
  Commit: Y | feat(ui): add public complaint tracking page by CC-ID

### Wave 4 — New shared components (3 todos)

- [x] 10. — Frontend: Extract DashboardLayout component
  What to do / Must NOT do:
  - Create `frontend/src/components/DashboardLayout.jsx` as a shared layout shell. **Props**:
    ```ts
    interface DashboardLayoutProps {
      title: string;          // Page heading text
      subtitle?: string;      // Optional sub-text below heading
      children: ReactNode;    // Main page content inserted below header
      role: 'citizen' | 'inspector' | 'collector' | 'officer';
      actions?: ReactNode;    // Optional action buttons rendered in header (right side)
    }
    ```
  - **Layout structure** (exact, not placeholder comments):
    ```
    ┌─────────────────────────────────────┐
    │  SIDEBAR (w-64, hidden ≤768px)      │  ← fixed left column
    │  ┌─────────────────────────────────┐│
    │  │ Role-colored header strip       ││
    │  │ Logo / app name                 ││
    │  ├─────────────────────────────────┤│
    │  │ Nav items (icon + label + link) ││
    │  │   Home      → /                 ││
    │  │   [role-specific items below]   ││
    │  │                                 ││
    │  │ Logout     → /   (at bottom)    ││
    │  └─────────────────────────────────┘│
    ├─────────────────────────────────────┤
    │  CONTENT AREA (flex-1)              │
    │  ┌─────────────────────────────────┐│
    │  │ HEADER: title | actions | logout ││  ← logout is text "Logout" link or button
    │  ├─────────────────────────────────┤│
    │  │ {children}                      ││
    │  └─────────────────────────────────┘│
    └─────────────────────────────────────┘
    ```
    **No notification bell, no user avatar** — those don't exist in the current app and are out of scope. Header right side contains only: action buttons (passed as `actions` prop) and a plain "Logout" text link/button that calls `api.post('/logout/')` and redirects to `/`.
  - **Responsive behavior**: On screens ≤768px, the sidebar is hidden entirely. A fixed **bottom tab bar** (h-16) appears containing 3-4 nav items (icon-only, no labels). Same Lucide icons as sidebar. Active tab highlighted with role's theme color.
  - **Nav route mapping per role** (exact routes):
    | Role | Sidebar items | Bottom tab items (mobile) |
    |------|--------------|--------------------------|
    | citizen | Home → `/`, My Complaints → `/citizen` | Home, My Complaints, Logout |
    | inspector | Home → `/`, Queue → `/inspector` | Home, Queue, Logout |
    | collector | Home → `/`, My Tasks → `/collector` | Home, My Tasks, Logout |
    | officer | Home → `/`, Dashboard → `/officer` | Home, Dashboard, Logout |
  - **Role color mapping**: citizen→cyan-500, inspector→emerald-500, collector→amber-500, officer→purple-500. Applied to: sidebar header strip, active nav item icon/text, bottom tab active color, top header accent border.
  - **Nav item active state**: Use `useLocation().pathname === path` — highlight matching route. Nav items are `<NavLink>`-like with active class.
  - **Implementation specifics**:
    - Use Lucide icons: `Home`, `ClipboardList` (for complaints/queue/tasks), `LayoutDashboard` (for officer dashboard), `LogOut` for logout
    - Use `useLocation()` from `react-router-dom` for active route detection
    - Theme class: apply via `role` mapping, e.g. `roleColors[role].sidebar` → `bg-cyan-900 text-cyan-200`
    - Sidebar: `w-64 h-screen fixed left-0 top-0 z-40`
    - Bottom tab: `fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-50 md:hidden`
    - Content wrapper: `ml-64` on desktop, `ml-0` on mobile + `pb-16` to avoid tab overlap
  - Update all 4 dashboard pages to use `<DashboardLayout>` instead of individual header/logout/background
  - Must preserve per-role color themes
  - Must preserve logout behavior
  - Must NOT change any page content beyond the shared shell (header title, subtitle, children)
  - Must NOT introduce notification bell, avatar, or other speculative UI

  Acceptance:
  - `ls frontend/src/components/DashboardLayout.jsx` → file exists
  - `grep 'DashboardLayout' frontend/src/pages/CitizenDashboard.jsx` → match (uses layout)
  - `grep 'DashboardLayout' frontend/src/pages/InspectorDashboard.jsx` → match
  - `grep 'DashboardLayout' frontend/src/pages/CollectorDashboard.jsx` → match
  - `grep 'DashboardLayout' frontend/src/pages/OfficerDashboard.jsx` → match
  - Each dashboard page has NO duplicate: `<header>`, logout button, background glow div (handled by layout)
  Commit: Y | feat(ui): extract shared DashboardLayout with role-aware sidebar

- [x] 11. — Frontend: Extract StatusBadge and StatCard components
  What to do / Must NOT do:
  - Create `frontend/src/components/StatusBadge.jsx`:
    ```jsx
    const StatusBadge = ({ status, size = 'sm' }) => {
        const config = {
            PENDING: { color: 'bg-yellow-500/20 text-yellow-300', icon: Clock },
            ASSIGNED: { color: 'bg-blue-500/20 text-blue-300', icon: UserCheck },
            RESOLVED: { color: 'bg-green-500/20 text-green-300', icon: CheckCircle2 },
            REJECTED: { color: 'bg-red-500/20 text-red-300', icon: XCircle },
            ESCALATED: { color: 'bg-orange-500/20 text-orange-400 animate-pulse', icon: AlertTriangle },
        };
        // Renders: pill with Lucide icon + status text
    };
    ```
  - Create `frontend/src/components/StatCard.jsx` (extracted from OfficerDashboard):
    ```jsx
    const StatCard = ({ title, value, icon: Icon, color }) => {
        // Renders: glass card with icon + value + label
    };
    ```
  - Replace inline `getStatusColor` in OfficerDashboard.jsx with `<StatusBadge>`
  - Replace inline `StatCard` in OfficerDashboard.jsx with imported `<StatCard>`
  - Must NOT change visual appearance — badges and cards should look identical to current inline versions

  Acceptance:
  - `ls frontend/src/components/StatusBadge.jsx frontend/src/components/StatCard.jsx` → both exist
  - `grep 'getStatusColor' frontend/src/pages/OfficerDashboard.jsx` → empty (replaced by StatusBadge)
  - `grep 'StatCard' frontend/src/pages/OfficerDashboard.jsx` → uses imported component
  Commit: Y | feat(ui): extract StatusBadge and StatCard shared components

- [x] 12. — Frontend: Fix CollectorDashboard IIFE + deduplicate execute().catch() pattern
  What to do / Must NOT do:
  - Extract the IIFE at CollectorDashboard.jsx lines 154-169 (conditional Maps URL render) into a named helper component or function
  - Create a shared 401 redirect helper: instead of `execute().catch(err => { if (err.response?.status === 401) navigate('/login/collector'); })` repeated 3x, use a single wrapper
  - Must NOT change behavior — only reduce duplication

  Acceptance:
  - `grep 'IIFE\|(() =>' frontend/src/pages/CollectorDashboard.jsx` → no inline IIFE in JSX
  - `grep -c 'if (err.response?.status === 401)' frontend/src/pages/CollectorDashboard.jsx` → ≤ 1
  Commit: Y | refactor: extract IIFE and deduplicate 401 redirect in CollectorDashboard

### Wave 5 — Accessibility + frontend tests (3 todos)

- [x] 13. — Frontend: Add basic accessibility (htmlFor, role, tabIndex, aria-label)
  What to do / Must NOT do:
  - Add `htmlFor` + `id` pairs to ALL form labels in Login.jsx, CitizenDashboard.jsx
  - Add `role="button"` + `tabIndex={0}` + `onKeyDown={(e) => e.key === 'Enter' && onClick()}` to GlassCard.jsx (lines 7-10) when onClick is provided
  - Add `aria-label` to all icon-only buttons — audit the ENTIRE codebase across all pages and components:
    | Page | Buttons needing aria-label |
    |------|--------------------------|
    | GlassCard.jsx | Close button (if any), action icon buttons |
    | Home.jsx | Role cards (if non-textual), navigation arrows |
    | CitizenDashboard.jsx | "Locate" geolocation button, logout button/icon |
    | InspectorDashboard.jsx | Assign buttons, "View Full" image links, logout |
    | CollectorDashboard.jsx | Resolve, Reject, Locate buttons; logout |
    | OfficerDashboard.jsx | Sort controls, refresh button, logout |
  - Fix InspectorDashboard image overlay (lines 108-116): make "View Full" link keyboard-accessible — show on focus as well as hover
  - Add `aria-live="polite"` to toast container for screen reader announcements
  - Must NOT change visual appearance

  Acceptance:
  - `grep -c 'htmlFor=' frontend/src/pages/Login.jsx` → ≥ 2 (username + password)
  - `grep -c 'htmlFor=' frontend/src/pages/CitizenDashboard.jsx` → ≥ 2 (name + location)
  - `grep 'role="button"' frontend/src/components/GlassCard.jsx` → match found
  - `grep 'aria-label' frontend/src/pages/*.jsx` → ≥ 4 (one per dashboard)
  Commit: Y | fix(a11y): add htmlFor, role, tabIndex, and aria-label attributes

- [x] 14. — Frontend: Remove mountedRef anti-pattern from useFetch
  What to do / Must NOT do:
  - Replace `mountedRef` pattern in `frontend/src/hooks/useFetch.js` with a simpler approach:
    - Remove `useRef`, `mountedRef.current = false` cleanup effect
    - Keep the `useCallback` with abort controller or just remove mount-guard (React 18+ strict mode handles this differently)
    - Rationale: The mountedRef pattern was needed in React 17 but React 18 strict mode double-invokes effects in dev. Setting state after unmount is harmless in React 18+ — React warns but doesn't leak.
  - Must NOT change the hook's public API (still returns `{ data, loading, error, execute }`)

  Acceptance:
  - `grep 'mountedRef' frontend/src/hooks/useFetch.js` → empty
  - `grep 'useRef' frontend/src/hooks/useFetch.js` → empty
  Commit: Y | refactor: remove mountedRef anti-pattern from useFetch

- [x] 15. — Frontend: Add tests for new components
  What to do / Must NOT do:
  - Create `frontend/src/components/__tests__/Toast.test.jsx`
  - Create `frontend/src/components/__tests__/StatusBadge.test.jsx`
  - Create `frontend/src/components/__tests__/StatCard.test.jsx`
  - Create `frontend/src/components/__tests__/DashboardLayout.test.jsx`
  - Create `frontend/src/pages/__tests__/TrackComplaint.test.jsx`
  - Each test: smoke test (renders without crash), prop variations (different statuses/roles/themes)
  - Must NOT require a running backend
  - Must NOT test implementation details

  Acceptance:
  - `ls frontend/src/components/__tests__/Toast.test.jsx frontend/src/components/__tests__/StatusBadge.test.jsx frontend/src/components/__tests__/StatCard.test.jsx frontend/src/components/__tests__/DashboardLayout.test.jsx frontend/src/pages/__tests__/TrackComplaint.test.jsx` → 5 files exist
  - `cd frontend && npx vitest run` → all tests pass (when Node.js available)
  Commit: Y | test: add tests for Toast, StatusBadge, StatCard, DashboardLayout, TrackComplaint

### Wave 6 — Final verification (1 todo)

- [x] 16. — Run final verification + QA
  What to do / Must NOT do:
  - F1 — Plan compliance: every todo's [x] confirmed
  - F2 — Code quality: no dead code, no console.log, no alert(), no emoji icons, no obvious comments
  - F3 — Automated tests: `cd backend && .venv/bin/python -m pytest --cov=api --cov-fail-under=60` passes
  - F4 — Manual QA: backend curl flow (guest → submit → inspector → assign → collector → resolve → stats)
  - F5 — Scope fidelity: no TypeScript, Redux, Docker, PWA, WebSocket

  Must NOT skip any verification step. Surface results.
  Commit: N (verification only)

## Commit strategy

| Wave | Commits | Message prefix |
|------|---------|----------------|
| Wave 0 | 0 (no code change) | — |
| Wave 1 | 4 | chore:, perf:, refactor:, perf: |
| Wave 2 | 3 | chore:, feat(ui):, feat(ui): |
| Wave 3 | 2 | feat(api):, feat(ui): |
| Wave 4 | 3 | feat(ui):, feat(ui):, refactor: |
| Wave 5 | 3 | fix(a11y):, refactor:, test: |
| Wave 6 | 0 (verification only) | — |
| Total | ~15 commits | All conventional commits |

## Success criteria

1. **Zero alert() calls** in frontend — all replaced with Toast system
2. **Zero emoji-as-icons** — all replaced with Lucide SVG
3. **Zero debug prints** in backend — no `print()` left in views.py
4. **Zero obvious comments** that restate code — only WHY comments remain
5. **Zero dead imports** — no `import React` from .jsx without `React.` usage
6. **6 queries → 1** for dashboard_stats endpoint
7. **N+1 queries eliminated** — `select_related` on all complaint FK lookups
8. **Public complaint tracking works** — `/track/CC-20260716-1853` shows status without login
9. **All 4 dashboards share DashboardLayout** — sidebar navigation, no duplicated logout/header
10. **Basic accessibility** — htmlFor/labels, role/tabIndex on interactive elements, aria-live for toasts
11. **All existing tests pass** — 112 backend tests, 29+ frontend tests
12. **No prototype-only patterns remain** — no `alert()`, no emoji-as-icons, no dead code
