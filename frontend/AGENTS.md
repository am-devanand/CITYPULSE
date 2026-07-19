# FRONTEND — City Care SPA

**Generated:** 2026-07-16

## OVERVIEW

React 18 + Vite 5 JavaScript SPA for waste management complaint system. ~1300 LOC across 6 pages, 1 component, and an Axios API client. No TypeScript, no tests, no state library.

## STRUCTURE

```
frontend/
├── vite.config.js          # Vite 5 + proxy /api,/media → :8000
├── postcss.config.js       # tailwindcss + autoprefixer
├── tailwind.config.js      # Custom animations (gradient, float, glow)
├── index.html
├── src/
│   ├── main.jsx           # ReactDOM.createRoot + BrowserRouter
│   ├── App.jsx            # Routes + AnimatePresence (framer-motion page transitions)
│   ├── index.css          # Tailwind directives + glass morphism utilities + role bg classes
│   ├── api/
│   │   └── index.js       # Axios client, 12 exported functions, withCredentials + CSRF
│   ├── components/
│   │   └── GlassCard.jsx  # Only shared component (framer-motion spring card)
│   └── pages/
│       ├── Home.jsx               # Landing page, 4 role cards → /login/:role
│       ├── Login.jsx              # Role-based login from URL param, stores user in localStorage
│       ├── CitizenDashboard.jsx   # Complaint form (geolocation + photo upload). ~266 LOC
│       ├── InspectorDashboard.jsx # Pending complaints grid + assign to collector. ~177 LOC
│       ├── CollectorDashboard.jsx # Task list with inline resolve/reject forms. ~224 LOC
│       └── OfficerDashboard.jsx   # Stats cards + complaint table + filters. ~154 LOC
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Routes | `src/App.jsx` | 6 routes, no 404, no error boundary |
| API client | `src/api/index.js` | Axios instance with baseURL `/api`, xsrfCookieName `csrftoken` |
| Build config | `vite.config.js` | Proxy `/api` and `/media` → `localhost:8000` |
| Styling | `src/index.css` | Glass utilities (`.glass`, `.glass-card`, `.glass-button`), role gradients (`.bg-citizen`, etc.) |
| Custom animations | `tailwind.config.js` | `animate-gradient`, `animate-float`, `animate-glow` keyframes |
| Complaint form | `src/pages/CitizenDashboard.jsx` | Uses `navigator.geolocation`, `FormData` with `multipart/form-data` |
| Task assignment | `src/pages/InspectorDashboard.jsx` | Polls GET `/complaints/?status=PENDING,ESCALATED` every 30s |
| Complaint table | `src/pages/OfficerDashboard.jsx` | Polls GET `/stats/` + `/complaints/` every 10s |
| Login flow | `src/pages/Login.jsx` | Sends role uppercased, stores `JSON.parse` user in `localStorage` |
| File uploads | `createComplaint`, `resolveComplaint` | Functions override Content-Type to `multipart/form-data` |

## CONVENTIONS

- **Auth flow**: Login stores user object in `localStorage`, logout calls `api.post('/logout/')` then navigates to `/`. No token refresh, no protected routes.
- **Role routing**: URL param `:role` drives Login page config + redirect path. Login uppercases role before sending.
- **Styling**: Tailwind utility classes + glass morphism CSS layer. Each dashboard uses role-specific bg color (`bg-emerald-900`, `bg-amber-900`, `bg-indigo-950`, `bg-slate-900`).
- **Polling**: InspectorDashboard polls every 30s, OfficerDashboard every 10s. No backoff or cleanup on unmount for OfficerDashboard.
- **Animations**: framer-motion `AnimatePresence mode="wait"` for page transitions. `whileHover` spring effects on GlassCard. Role cards use staggered `transition.delay`.
- **Error handling**: Dashboards redirect to `/login/:role` on 401. Error messages parsed from `err.response.data.error` or `err.response.data.detail` or flattened validation errors.
- **Guest flow**: Citizen login hints `guest/guest`. Backend creates `guest_<timestamp>` users.

## ANTI-PATTERNS (FRONTEND-SPECIFIC)

- **Code duplication**: All 4 dashboards independently manage fetch/loading/error/logout. No layout/HOC/context shared. GlassCard is the only component.
- **No auth routing**: Any user can navigate to any dashboard path. No `ProtectedRoute` or `useAuth` guard.
- **Infinite polling**: OfficerDashboard polls every 10s with no backoff, no pause on tab blur, no cleanup on error.
- **Mock distances**: InspectorDashboard uses `Math.random() * 5` for collector distances instead of real data.
- **localStorage for auth state**: User JSON stored/read from `localStorage.getItem('user')` with no validation, no refresh logic.
- **No error boundary**: A render crash in any page takes down the whole SPA. No fallback UI.
- **No 404 route**: Unknown paths show blank page. `Routes` has no `<Route path="*">`.
- **Dead `@types/react`**: Listed in devDependencies but all files are `.jsx`. TypeScript never used.
- **Console.logs not stripped**: `console.error("Submission error:", err)` and similar remain in production code.
- **No CSS purging safety**: Tailwind scans `**/*.{js,ts,jsx,tsx}` but all files are `.jsx` — OK but fragile if `.tsx` added later.
- **Hardcoded Google Maps URL**: `https://www.google.com/maps/search/?api=1&query=${coords}` in CollectorDashboard — no error handling if coords missing.

## COMMANDS

```bash
npm run dev      # Vite dev → :5173 (proxies /api, /media to :8000)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```
