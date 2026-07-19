# BACKEND — City Care API

## OVERVIEW

Django 5.0 + DRF 3.14 REST API. Single `api/` app, SQLite-only, 2 models, 8 view classes, 7 serializers.

## STRUCTURE

```
backend/
├── citycare/                   # Project config
│   ├── settings.py             # DRF, CORS, pymongo (dead)
│   ├── urls.py                 # mounts admin/ + api/ + media/
│   └── wsgi.py                 # WSGI-only
├── api/                        # Single app
│   ├── models.py               # User + Complaint + dead ComplaintStructure
│   ├── views.py                # 6 APIViews + 2 ModelViewSets + 1 @api_view
│   ├── serializers.py          # 7 DRF serializers
│   ├── urls.py                 # DefaultRouter + 6 manual paths
│   ├── utils.py                # haversine, parse_coords, is_within_radius
│   ├── admin.py                # UserAdmin only
│   ├── management/commands/
│   │   └── seed_db.py          # 5 users + 2 complaints
│   └── migrations/             # 2 migrations
├── manage.py
├── requirements.txt            # 5 deps (Django, DRF, pymongo, corsheaders, Pillow)
├── verify_auth.py              # Standalone auth tester for 5 seed users
├── test_image.py               # Standalone Pillow + DRF ImageField test
├── db.sqlite3                  # Committed to repo
└── media/complaints/
    ├── before/                 # Complaint photo upload target
    └── after/                  # Resolution photo upload target
```

## WHERE TO LOOK

| Task | File | Lines/Notes |
|------|------|-------------|
| Change model fields | `api/models.py` | User (AbstractUser+role/phone), Complaint (15 fields, auto CC- ID via UUID4) |
| Add endpoint | `api/views.py` + `api/urls.py` | ModelViewSet for CRUD, APIView for actions, @api_view for GET. Wire path() in urls.py |
| Tweak spam/duplicate | `api/views.py` ComplaintViewSet.create() | Lines 108-177. 5/hr threshold, 50m radius, 24h window |
| Change serializer | `api/serializers.py` | ComplaintSerializer vs ComplaintCreateSerializer (different fieldsets). Plain Serializers for assign/reject |
| Debug login | `api/views.py` LoginView | Lines 50-78. Guest creates user on every login, password always 'guest' |
| Coordinate math | `api/utils.py` | haversine_distance, parse_coords("lat,lng"), is_within_radius(default 50m) |
| Seed/complaint data | `api/management/commands/seed_db.py` | DESTRUCTIVE — deletes all complaints first. 5 users (pw: admin), 2 complaints |
| Auth config | `citycare/settings.py` | SessionAuthentication + AllowAny. CORS: localhost:5173 only |
| Escalation | `api/views.py` SimulateTimeoutView | Lines 235-256. 16h PENDING/ASSIGNED cutoff, force_escalate flag |
| Standalone tests | `verify_auth.py`, `test_image.py` | Auth test for 5 users. Pillow + DRF ImageField validation |

## VIEW PATTERNS

- **ModelViewSet**: UserViewSet, ComplaintViewSet — auto CRUD + @action endpoints (collectors, me)
- **APIView**: Login, Logout, Assign, Resolve, Reject, SimulateTimeout — single POST handlers
- **@api_view**: dashboard_stats — GET aggregating 6 status counts
- **csrf_exempt**: LoginView + ComplaintViewSet at dispatch level
- **URL routing**: DefaultRouter for viewsets, manual `path()` for actions. `<str:complaint_id>` maps to Complaint PK, NOT the CC- string field

## CONVENTIONS

- **Serializer pattern**: Separate create serializer (write-only password/subset fields). Action serializers are plain `serializers.Serializer`. File upload read from request.FILES, not serializer.
- **Custom ID**: Complaint.complaint_id = `CC-YYYYMMDD-XXXX` (UUID4 suffix), generated in model save().
- **Meta.db_table**: Both models override table name: `users`, `complaints`.

## ANTI-PATTERNS (BACKEND-SPECIFIC)

- **PK vs complaint_id confusion**: Assign/Resolve/Reject views do `Complaint.objects.get(id=complaint_id)` but URL param is named `complaint_id` — misleading, uses auto-increment PK not the CC- formatted string field.
- **Bare except in create()**: Lines 173-177 catch Exception, return 400 — hides real errors and tracebacks.
- **Guest user leak**: LoginView creates `guest_<timestamp>` users with no cleanup or cap — infinite growth in users table.
- **Complaint not in admin**: admin.py registers User only. No way to manage Complaints from Django admin.
- **Seed_db destructive**: `Complaint.objects.all().delete()` at line 40 — wipes all existing complaints on every seed run.
- **pymongo at module level**: settings.py lines 70-73 create MongoClient on import — never closed, never used in views.

## COMMANDS

```bash
python manage.py seed_db              # Destructive seed: 5 users + 2 complaints
python manage.py runserver            # → localhost:8000
python verify_auth.py                 # Standalone: test all 5 seed user logins
python test_image.py                  # Standalone: verify Pillow + image serializer
```
