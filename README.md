# CPU Performance Analyzer — CPU Performance Benchmarking & Analysis Platform

A complete Computer Organization (CO) major-project implementation: authenticated workspace, browser CPU benchmark, results dashboard, analytics, history, run comparison, JSON export/import, cloud/remote-run analysis, methodology page and responsive UI.

## Important implementation note

The demo benchmark engine currently runs in the browser using TypeScript/JavaScript workload definitions. The repository includes a C++ reference engine under `benchmark-engine/` for the planned Emscripten/WebAssembly mode. Do not claim the browser benchmark is C++/WASM unless that build is actually integrated.

## Stack

- React + TypeScript + Vite
- Recharts + Lucide icons
- FastAPI + Python
- JWT authentication
- SQLAlchemy
- SQLite by default; PostgreSQL supported
- C++/CMake reference benchmark engine

## Run locally — frontend + backend together

You no longer need two terminals. From the project root, run:

```bash
npm run setup
npm run dev
```

`npm run setup` creates the backend Python virtual environment, installs Python dependencies, and installs frontend dependencies.
`npm run dev` starts both servers together:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API: http://localhost:8000/api

### Windows shortcut

You can also double-click `RUN_PROJECT.bat`. On the first run it performs setup automatically, then starts both frontend and backend together.

Press `Ctrl+C` in the terminal to stop both servers.

## PostgreSQL

Set `DATABASE_URL=postgresql+psycopg://cpu_performance_analyzer:cpu_performance_analyzer@localhost:5432/cpu_performance_analyzer` after starting `docker compose up -d`.

## Pages

Dashboard → Benchmark → Analytics → History → Compare → Cloud Analyzer → Methodology

## Benchmark metrics

Execution time, throughput, normalized category score, overall score, speedup and parallel efficiency. The overall score is project-specific and should not be presented as an industry-standard CPU rating.

## Latest PBL improvements
- Benchmark identity is automatically shown as `<account name>'s Laptop` and stored in exported run data.
- Comparison view includes workload win/tie counts, largest workload gap, percentage gap, and an aggregate-score explanation.
- Results and dashboard expose system information including logical cores, platform, browser, and benchmark owner.
- Methodology page now documents the end-to-end benchmark flow: detect system, execute workloads, measure, score, store/export, and compare.



## Project identity

Each account automatically receives a machine label in the form **`<account name>'s Laptop`**. For example, an account named **Anwesha** is displayed as **Anwesha's Laptop**, while an account named **Yashi** is displayed as **Yashi's Laptop**. The label is stored with every benchmark result and appears in history and CPU comparison.
