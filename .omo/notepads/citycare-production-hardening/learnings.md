# citycare-production-hardening — Learnings

## 2026-07-16 Session start

- Project: CityPulse (Django 5.0 + DRF 3.14 backend, React 18 + Vite 5 frontend)
- Plan: 21 todos, 5 waves, 811 lines
- Wave 1 has file-conflict constraints: todos 1, 5, and 3 share `settings.py` and `requirements.txt` → must be sequential
- Todos 2 (.gitignore) and 4 (frontend favicon + Home.jsx) have completely disjoint files → can run in parallel with anything
- Todo 1 done: `backend/.env` created with SECRET_KEY/DEBUG/ALLOWED_HOSTS; `python-decouple` added to requirements.txt; settings.py uses `config()` for all 3 values; `manage.py check` passes; no pip available in base env (Python 3.14.6 without ensurepip) — used venv workaround for verification
- Todo 4 done: `frontend/index.html` — `/vite.svg` changed to `/favicon.svg`; `frontend/public/favicon.svg` created (trash bin SVG icon in cyan); `Home.jsx` — each role object got an `icon` field (🏠/🔍/🚛/📊). Grep verification passed. Vite build skipped — Node.js not installed in this environment.

- Todo 2 done: `.gitignore` created at repo root with Python/Node/Django/Vite/IDE entries; `git rm --cached` run for `backend/db.sqlite3`, `frontend/dist/`, `backend/media/` — all verified clean (ls-files empty, check-ignore exits 0, status shows D entries)
  - Note: `__pycache__/` and `*.py[cod]` in .gitignore won't untrack already-tracked __pycache__ files — would need separate `git rm --cached` for those

- Todo 9 done: `backend/api/admin.py` — added `ComplaintAdmin(admin.ModelAdmin)` with list_display, list_filter (status/urgency/created_at), search_fields (complaint_id/location_address/complainant_name), readonly_fields (complaint_id/created_at/updated_at + image previews), list_select_related (complainant/assigned_to/assigned_by), 7-section fieldsets, and two `@admin.display` image preview methods with format_html + fallback to '-'. `python manage.py check` exits 0. UserAdmin left untouched.

- Todo 6 done: CSRF hardening — removed `@csrf_exempt` from LoginView and ComplaintViewSet; added `CSRFTokenView` (GET /api/csrf/ with `ensure_csrf_cookie` + `AllowAny`); global default changed from `AllowAny` to `IsAuthenticatedOrReadOnly`; explicit `AllowAny` on LoginView, CSRFTokenView, and ComplaintViewSet.create(); frontend App.jsx now fetches /csrf/ on mount with loading spinner until CSRF cookie is set. Key insight: ComplaintViewSet.create() needs `get_permissions()` override returning `[AllowAny()]` so unauthenticated guests can still submit complaints — the `create` action itself already handles anonymous users via `request.user.is_authenticated` check.

- Verified: python-decouple not installed system-wide; needed `python -m venv .venv` workaround for `manage.py check` verification. venv path is `backend/.venv/bin/python`.

- Wave 2 Batch B dispatched: Todo 7 (guest reuse in views.py) + Todo 8 (ProtectedRoute in frontend) — parallel, disjoint files.

- Todo 10 done: Fixed bare `except Exception` in ComplaintViewSet.create() — replaced with `serializers.ValidationError` catch (400) + generic `Exception` catch (500 with `logger.exception`). Removed `print()`, `traceback.print_exc()`, and inline `import traceback`. Added `import logging` + `logger = logging.getLogger(__name__)`. Added DRF `serializers` to the `from rest_framework import` line. `python manage.py check` → 0 issues.

- Todo 13 done: seed_db.py made idempotent — added `add_arguments` with `--force` flag; guard clause checks `Complaint.objects.exists()` and skips/seeds accordingly; guest user created via `get_or_create` instead of fragile `get/exists/create` pattern. `manage.py check` → 0 issues.

- Todo 20 done: pytest + pytest-django + pytest-cov added to requirements.txt; pytest.ini created; 6 test files (112 tests total) covering models, utils, serializers, auth views, complaint CRUD/spam/duplicate, and action views (assign/resolve/reject/simulate-timeout/stats). Coverage: 94% across api/ module (models 100%, serializers 100%, utils 100%, views 95%, urls 100%). Key findings:
  - **Bug found**: `views.py:192` — `serializers.ValidationError` handler uses `e.details` (plural) but DRF attribute is `e.detail` (singular). Causes `AttributeError` caught by generic Exception handler → 500 instead of 400.
  - **Django 5.0 + Python 3.14 incompatibility**: `django/template/context.py:Context.__copy__()` crashes with `AttributeError: 'super' object has no attribute 'dicts'` when test client tries to copy template context during error-page rendering. Makes the 500 response crash cascade.
  - **Duplicate detection runs before spam detection** in `ComplaintViewSet.create()` — complaints at same coords get caught as duplicates (200 with `is_duplicate: True`) before spam check (429) can trigger. Spam detection only effectively fires for same-user+same-coords complaints that were NOT created via the API (bypassing duplicate check).
  - **Dead serializers**: `RejectComplaintSerializer` defined but never used in `RejectComplaintView` — view reads `request.data.get('reason')` directly. `ResolveComplaintSerializer` also unused in its view.
  - **SimulateTimeoutView** requires authentication (default `IsAuthenticatedOrReadOnly` denies POST). Guest/anonymous users cannot trigger timeout.
  - **LogoutView** requires authentication for POST (same reason).
  - Spam tests must create complaints directly via `Complaint.objects.create()` (not bulk_create — bypasses `save()` which generates `complaint_id` → UNIQUE constraint violation for empty `complaint_id`).

- Todo 21 done: Frontend test suite set up — vitest ^1.6.1, @testing-library/react ^14.1.2, @testing-library/jest-dom ^6.2.0, jsdom ^24.0.0 added to devDependencies; `vitest.config.js` created with jsdom environment; npm install used npmmirror.com registry (direct npmjs.org timed out).
  - 5 test files, 29 tests total, all passing:
    - `src/api/__tests__/index.test.js` — 14 tests covering all 12 API functions (getCsrfToken, login, logout, getCurrentUser, getCollectors, getComplaints, createComplaint, assignComplaint, resolveComplaint, rejectComplaint, simulateTimeout, getDashboardStats) with mocked axios using `vi.hoisted()` pattern to avoid temporal-dead-zone hoisting issue
    - `src/pages/__tests__/Home.test.jsx` — 6 tests: renders without crash, hero heading, all 4 role cards, role descriptions, nav buttons, footer with year
    - `src/pages/__tests__/NotFound.test.jsx` — 4 tests: 404 heading, "Page not found" message, descriptive text, Go Home link with href="/"
    - `src/components/__tests__/ProtectedRoute.test.jsx` — 3 tests: null user redirects to "/", user present renders children, guest user renders children (mock useAuth from AuthContext + mock Navigate)
    - `src/components/__tests__/ErrorBoundary.test.jsx` — 2 tests: renders children normally, catches thrown errors and shows fallback UI ("Something went wrong" + Go Home link)
  - Key insight: vi.mock() is hoisted above imports, so mock objects must be created via vi.hoisted() factory to avoid ReferenceError: Cannot access before initialization.
  - framer-motion mocked to plain div wrappers; `whileHover` prop warning on DOM element expected and harmless.
  - Network note: npm install needed --registry=https://registry.npmmirror.com to succeed; Node.js was not pre-installed — downloaded v20.18.0 binary from npmmirror.com mirror.
