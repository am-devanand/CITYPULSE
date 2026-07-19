---
slug: citycare-ui-overhaul
status: awaiting-approval
intent: unclear
pending-action: await user approval to execute plan
approach: Fix navigation consistency across all pages, improve visual originality, and resolve functionality issues in one focused pass — parallel where possible.
---

# Draft: citycare-ui-overhaul

## Findings
1. **Home page nav** "Home" button calls `window.scrollTo()` — redundant since already on Home
2. **No "Track Complaint" entry point** on Home page — users can't discover `/track/:id` feature
3. **Login/Signup pages** use flat `bg-citizen` gradient overlay — no mesh-gradient background, inconsistent with dashboard aesthetic
4. **CitizenDashboard** uses manual `"!"` text in yellow circle instead of Lucide `AlertTriangle` icon
5. **TrackComplaint** timeline uses `&#10003;` HTML entity instead of Lucide `Check` icon
6. **InspectorDashboard "No Image"** placeholder uses plain text — no icon
7. **GlassCard** has `role="button"` on ALL cards even when no `onClick` provided
8. **InspectorDashboard** collector distances show "N/A" — should show mock distances like the original had
9. **CitizenDashboard geolocation** sets fake `"123 Simulated St, Near Lat:..."` address
10. **CollectorDashboard "Simulate Delay"** button has inconsistent styling (`AlertTriangle` inline-block pattern)

## Decisions
- Adopt Lucide icons everywhere (no HTML entities, no text-based icons)
- Use mesh-gradient background consistently on all pages (Login, Signup, TrackComplaint)
- Add "Track Complaint" input on Home page hero section
- Remove redundant GlassCard `role="button"` when no onClick
- Show mock collector distances (0.5-5.0 km range) instead of "N/A"
- Use a more realistic geolocation address format instead of "123 Simulated St"

## Scope IN
1. Navigation fixes (Home nav, DashboardLayout active state, TrackComplaint back button)
2. Design consistency (mesh-gradient on Login/Signup/TrackComplaint, icon standardization)
3. Functionality fixes (collector distances, geolocation text, GlassCard role)
4. Home page improvements (add track complaint input)
5. Track complaint discovery from Home page

## Scope OUT
- No TypeScript migration
- No new dependencies (all changes use existing: lucide-react, framer-motion, tailwind)
- No backend model changes
- No auth flow changes
- No database migration
- No CSS framework change
