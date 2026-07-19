# citycare-production-hardening — Decisions

## Execution order for Wave 1 (file-conflict aware)

- Batch A (parallel, disjoint files): Todos 1, 2, 4
- Batch B (sequential after 1, shares settings.py + requirements.txt): Todo 5
- Batch C (sequential after 1+5, shares settings.py + requirements.txt + depends on 1): Todo 3
