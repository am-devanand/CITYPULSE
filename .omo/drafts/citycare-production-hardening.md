---
slug: citycare-production-hardening
status: drafting
intent: unclear
pending-action: write .omo/plans/citycare-production-hardening.md
approach: Fix all broken/incomplete features, plug security holes, eliminate dead code, add missing infrastructure (tests, .gitignore, error boundaries, auth guards), deduplicate dashboard code — making the prototype fully functional and production-viable.
---

# Draft: citycare-production-hardening

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | Outcome | Status | Evidence |
|----|---------|--------|----------|
| C1 Infrastructure & Config | .env with SECRET_KEY, DEBUG=False, proper ALLOWED_HOSTS, .gitignore, favicon | active | backend/citycare/settings.py:10-14, frontend/index.html:11 |
| C2 Dead Code Removal | Strip pymongo, dead ComplaintStructure class, dead @types/react | active | backend/citycare/settings.py:70-73, backend/api/models.py:87-108, frontend/package.json:19-20 |
| C3 Auth Hardening | Remove csrf_exempt, fix guest user leak, add ProtectedRoute on frontend | active | backend/api/views.py:49,87, backend/api/views.py:60-69 |
| C4 Complaint Workflow Fixes | Fix PK vs complaint_id confusion, add Complaint admin, fix bare except, fix mock distances, fix destructive seed | active | backend/api/views.py:173-177, backend/api/views.py:185-187, backend/api/admin.py, backend/api/management/commands/seed_db.py:40 |
| C5 Dashboard & UX | Fix infinite polling with backoff, add ErrorBoundary, add 404 route, fix hardcoded Google Maps URL, fix emoji usage | active | frontend/src/pages/OfficerDashboard.jsx:18, frontend/src/App.jsx, frontend/src/pages/CollectorDashboard.jsx:149 |
| C6 Code Quality | Extract shared dashboard patterns (useAuth hook, useFetch hook), fix empty if block, fix typo | active | frontend/src/pages/ - all 4 dashboards |
| C7 Testing | pytest-django backend tests, vitest frontend tests, CI/CD config | active | No test files exist anywhere |
| C8 Admin Panel | Register Complaint in admin, add list filters, search, inline images | active | backend/api/admin.py: only User registered |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->

| Assumption | Adopted Default | Rationale | Reversible? |
|-----------|----------------|-----------|-------------|
| Auth backend stays session-based | Keep SessionAuthentication, remove csrf_exempt, add CSRF properly | Working foundation, minimal change | Yes |
| Guest login behavior | Cap guest accounts: cleanup on use, limit to N active, or switch to anonymous session | Prevents infinite user table growth | Yes |
| State management for frontend | Keep useState/useEffect (no Redux/Zustand) | App is small, not worth the dependency | Yes |
| Testing framework (backend) | pytest + pytest-django + coverage | Industry standard for Django projects | Yes |
| Testing framework (frontend) | vitest + @testing-library/react | Matches Vite toolchain | Yes |
| .gitignore generation | Python + Node + Django + Vite standard | Covers db.sqlite3, node_modules, .env, __pycache__, dist/ | Yes |
| Error boundary approach | React ErrorBoundary class component at App level | Straightforward, no deps needed | Yes |
| Auth routing approach | ProtectedRoute component wrapping dashboard routes | Pattern matches react-router-dom v6 | Yes |
| Polling backoff | Exponential backoff with tab-visibility pause | Reduces server load, matches best practice | Yes |
| Code deduplication | Extract useAuth (context) and useFetch custom hooks | Shared state + fetch logic, not over-engineering | Yes |
| Complaint ID field in URLs | Switch URL params to use `complaint_id` (CC- string) instead of auto-PK | The complaint_id field is the user-facing identifier | No - changes URL contract |
| Deployment / CI/CD | Scope OUT (user didn't ask) | Not part of "make features functional" | N/A |
| TypeScript migration | Scope OUT (user didn't ask, all .jsx) | Would be a separate project | N/A |

## Findings (cited - path:lines)

**Backend:**
- Hardcoded SECRET_KEY at `backend/citycare/settings.py:10`
- DEBUG=True at `settings.py:12`, ALLOWED_HOSTS=['*'] at `settings.py:14`
- Dead pymongo module-level client at `settings.py:70-73`
- csrf_exempt on LoginView at `backend/api/views.py:49`
- csrf_exempt on ComplaintViewSet at `backend/api/views.py:87`
- Infinite guest user creation at `backend/api/views.py:60-69` — creates `guest_<timestamp>` on every guest login
- Bare `except Exception` swallows errors at `backend/api/views.py:173-177`
- PK vs complaint_id confusion: URL param named `complaint_id` but uses `Complaint.objects.get(id=complaint_id)` at `backend/api/views.py:185` — queries auto-increment PK not the CC- string
- Complaint not in admin at `backend/api/admin.py` — registers only User
- Seed_db destructive at `backend/api/management/commands/seed_db.py:40` — deletes all complaints first
- Dead ComplaintStructure class at `backend/api/models.py:87-108`
- **🔴 DRF AllowAny default**: `DEFAULT_PERMISSION_CLASSES: [AllowAny]` at `settings.py:99-101` — all endpoints open
- **🟠 Seed_db fragile**: `User.objects.get(username='guest')` at `seed_db.py:42` — crashes if guest user doesn't exist yet

**Frontend:**
- No 404 route at `frontend/src/App.jsx:26`
- No ErrorBoundary anywhere
- No auth guards — any user can navigate to any dashboard URL
- Infinite polling: OfficerDashboard polls every 10s at `frontend/src/pages/OfficerDashboard.jsx:18`
- 30s polling on InspectorDashboard at `frontend/src/pages/InspectorDashboard.jsx:21` (less critical but no backoff)
- Mock distances with `Math.random() * 5` at `frontend/src/pages/InspectorDashboard.jsx` (line ~31)
- localStorage for auth state — no validation at `frontend/src/pages/Login.jsx`, `frontend/src/pages/CollectorDashboard.jsx`
- Dead `@types/react` + `@types/react-dom` in devDependencies at `frontend/package.json:19-20`
- Empty `if (res.data.is_duplicate) { }` block at `frontend/src/pages/CitizenDashboard.jsx:65`
- `handeLogout` typo at `frontend/src/pages/InspectorDashboard.jsx` (~line 53)
- Hardcoded Google Maps URL at `frontend/src/pages/CollectorDashboard.jsx:~149`
- Code duplication: 4 dashboards independently manage fetch/loading/error/logout
- Console.logs in production code at `CitizenDashboard.jsx:69`, `InspectorDashboard.jsx:36`
- Broken favicon at `frontend/index.html:11` — references `/vite.svg` which doesn't exist
- No .gitignore at repo root

## Decisions (with rationale)

1. **Keep Django SessionAuthentication** — it's the established pattern, works with DRF, minimal migration risk. Remove csrf_exempt and add proper CSRF handling (frontend already sends X-CSRFToken header, backend just needs to stop disabling it).

2. **Fix guest login by capping + cleanup** — Rather than removing guest access (which is a feature of the app), cap guest users with a cleanup cron or TTL. Alternative: anonymous session with no user record.

3. **Use complaint_id (CC- string) in URLs** — The URL path param is named `complaint_id` but actually uses auto-PK. Switch to the user-facing complaint_id field so URLs are meaningful and consistent.

4. **Extract hooks for dashboard deduplication** — `useAuth` context for auth state/logout, `useFetch` hook for data fetching with loading/error states. This reduces the ~60% duplicated code across dashboards.

5. **Exponential backoff + tab-visibility for polling** — Use a custom `usePoll` hook that implements exponential backoff (start 10s, max 60s) and pauses when the tab is hidden.

6. **pytest + pytest-django for backend** — Industry standard, integrates with Django, supports fixtures and parametrize.

7. **vitest + @testing-library/react for frontend** — Matches the Vite toolchain (no Jest config needed), modern React testing.

## Scope IN

- Fix all security issues (SECRET_KEY → .env, DEBUG=False, CSRF, auth guards)
- Remove dead code (pymongo, ComplaintStructure, @types/react)
- Fix broken features (guest leak, mock distances, PK vs complaint_id, bare except)
- Add missing infrastructure (.gitignore, ErrorBoundary, 404 route, favicon)
- Fix dashboard polling (backoff + tab-visibility)
- Add Complaint to admin panel
- Extract shared hooks to deduplicate dashboards
- Add comprehensive test suite (backend pytest + frontend vitest)
- Clean up code (console.logs, empty blocks, typos)
- Fix seed_db to be non-destructive

## Scope OUT (Must NOT have)

- TypeScript migration (all files stay .jsx)
- State management library (no Redux, Zustand, or Recoil)
- UI redesign or branding changes
- Mobile app or PWA
- Deployment/CI/CD configuration
- Real-time/WebSocket features
- Third-party auth providers (Google, OAuth)
- Docker containerization
- API versioning
- Performance optimization beyond what's listed

## Open questions

None — all resolved via adopted defaults (see above).

## Approval gate
status: plan-ready
plan-file: .omo/plans/citycare-production-hardening.md
review-summary: >
  Dual high-accuracy review complete.
  Momus: APPROVE (no conditions — minor non-blocking issues noted).
  Oracle: CONDITIONAL APPROVE (4 conditions — all applied to plan).
  Conditions applied:
  1. Added DRF DEFAULT_PERMISSION_CLASSES enforcement (IsAuthenticatedOrReadOnly) + exemptions → todo 6
  2. Added ProtectedRoute→useAuth context migration → todo 17
  3. Fixed mock-distance/useFetch ordering conflict (todo 12→18 dependency + preservation note) → dep matrix + todo 18
  4. Added CSRF race condition loading state to App.jsx → todo 6
  Additional fix: seed_db now get_or_create guest user → todo 13
review-conditions-met: true
plan-finalized: true
