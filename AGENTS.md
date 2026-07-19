# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-16
**Commit:** 090d329
**Branch:** main

## OVERVIEW

City Care — Smart waste management complaint system. Citizens report garbage issues with photos, inspectors assign to collectors, collectors resolve/reject with proof. Monorepo with Django 5.0 + DRF 3.14 backend and React 18 + Vite 5 frontend.

## STRUCTURE

```
repo/
├── backend/       # Django REST API (Python)
│   ├── citycare/  # Project config (settings, root URL, WSGI)
│   └── api/       # Single Django app (models, views, serializers)
└── frontend/      # React SPA (JS/JSX)
    └── src/
        ├── api/       # Axios API client
        ├── components/# Shared GlassCard component
        └── pages/     # 6 role-based page components
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API models (User, Complaint) | `backend/api/models.py` | Custom AbstractUser + Complaint with spam/duplicate logic |
| API views & endpoints | `backend/api/views.py` | 8 view classes, ~280 lines |
| API serializers | `backend/api/serializers.py` | 7 DRF serializers |
| API URL routing | `backend/api/urls.py` | Router + custom actions |
| Coordinate utilities | `backend/api/utils.py` | Haversine, parse_coords, radius check |
| Django settings | `backend/citycare/settings.py` | Hybrid DB config (SQLite active, MongoDB dead) |
| Seed data | `backend/api/management/commands/seed_db.py` | 5 users + 2 complaints |
| Frontend entry | `frontend/src/main.jsx` | BrowserRouter → App |
| React routes | `frontend/src/App.jsx` | 6 routes, AnimatePresence |
| API client | `frontend/src/api/index.js` | Axios, 12 exported functions |
| Frontend pages | `frontend/src/pages/` | Home, Login, 4 dashboards |
| Vite config | `frontend/vite.config.js` | Proxy /api + /media → :8000 |

## CONVENTIONS

- **Auth**: Session-based DRF auth. Frontend uses `withCredentials: true` + CSRF tokens.
- **Images**: Complaint photos via Pillow, stored in `media/complaints/{before,after}/`.
- **ID format**: Complaint IDs as `CC-YYYYMMDD-XXXX`.
- **Styling**: Tailwind utility classes + glass morphism via custom CSS. framer-motion for animations.
- **API proxy**: Vite dev server proxies `/api` and `/media` to Django at `localhost:8000`.
- **Time zone**: `Asia/Kolkata`.

## ANTI-PATTERNS (THIS PROJECT)

- **Hardcoded secrets**: `SECRET_KEY`, `DEBUG=True`, `ALLOWED_HOSTS=['*']` in settings.py — use env vars.
- **No .gitignore**: `db.sqlite3`, `media/`, `__pycache__`, `.env` are all trackable.
- **Dead MongoDB code**: `pymongo` imported and MongoClient created in settings.py but never used in views. All data in SQLite.
- **csrf_exempt on login + complaints**: Views decorated with `@csrf_exempt` — disables CSRF protection.
- **Zero tests**: No test framework, no test files, no CI/CD.
- **Guest login abuse**: Creates infinite `guest_<timestamp>` users with password `guest`.
- **Infinite polling**: OfficerDashboard polls `/api/stats/` every 10s with no backoff.
- **Mock data in production**: InspectorDashboard uses `Math.random()` for collector distances.

## UNIQUE STYLES

- Glass morphism UI with per-role color themes (framer-motion cards + mesh gradients).
- Guest login flow for citizens (no password required).
- Spam detection: blocks 5+ submissions from same user+location within 1 hour.
- Duplicate detection: within 50m radius using haversine, increments urgency instead of creating new.
- Auto-escalation: complaints PENDING/ASSIGNED >16h auto-escalated.
- Simulate-timeout endpoint for testing escalation workflow.

## COMMANDS

```bash
# Backend
cd backend && pip install -r requirements.txt
python manage.py migrate
python manage.py seed_db
python manage.py runserver          # → :8000

# Frontend
cd frontend && npm install
npm run dev                         # → :5173 (proxies /api to :8000)
npm run build                       # → dist/
```

## NOTES

- `db.sqlite3` is committed to the repo with seed data (passwords: `admin` and `guest`).
- No ASGI support — WSGI only, no async/WebSocket.
- Frontend uses `.jsx` (no TypeScript) despite `@types/react` in devDeps.
- Single shared component (`GlassCard`) — significant UI duplication across dashboards.
- No error boundary or 404 page in React routing.
