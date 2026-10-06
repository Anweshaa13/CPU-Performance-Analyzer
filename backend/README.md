# CPU Performance Analyzer Backend

FastAPI service with JWT authentication and SQLAlchemy persistence. It defaults to SQLite for a one-command local demo and supports PostgreSQL by setting `DATABASE_URL`.

## Run

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The frontend expects `http://localhost:8000/api` by default.
