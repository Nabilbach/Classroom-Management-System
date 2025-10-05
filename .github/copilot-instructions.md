## Quick orientation — what this repo is

- Monorepo-style project with a React + Vite frontend in `src/` and an Express + Sequelize backend in `backend/`.
- Main database is a SQLite file at the repository root named `classroom.db`. The backend opens it via `backend/config/database.js` (Sequelize, storage path: `path.join(__dirname, '..', '..', 'classroom.db')`).

## Big-picture architecture (must-read files)

- Backend entrypoint: `backend/index.js` — starts Express, wires routes, and runs small, targeted migration helpers (see `preMigrateCleanup`, `ensureAttendanceIndexes`, and `ensureAssessmentColumns`).
- Models and associations: `backend/models/index.js` — look here to understand relationships (Students, Sections, Attendances, FollowUps, StudentAssessments, Lessons, etc.).
- Routes are mounted in `backend/index.js` (e.g. `/api/students`, `/api/lessons`, `/api/sections/...`) and implemented under `backend/routes/` (search for the route files by name).
- DB config: `backend/config/database.js` — SQLite dialect; avoid altering storage path unless intentional.

## Important project-specific patterns and conventions

- Database and schema
  - SQLite file `classroom.db` is treated as the single source of truth. Many maintenance scripts in the repo manipulate this file directly (`*.cjs` scripts). Be careful modifying schema: the code avoids `sequelize.sync({ alter: true })` for SQLite and applies small migrations manually in `backend/index.js`.
  - Some columns (e.g. `scores` on `StudentAssessments`) are stored as JSON text; migrations add these columns at startup when missing.

- API payload normalization
  - Routes normalize incoming payloads liberally (snake_case ↔ camelCase). Example: student creation in `backend/index.js` accepts `first_name`, `firstName`, `first`, etc., and trims/normalizes values before inserting.
  - IDs are often strings (many create calls use `Date.now().toString()` as generated ids). Treat model IDs as strings unless the model specifies otherwise.

- Error handling and constraints
  - Routes explicitly check for Sequelize errors (e.g., `SequelizeUniqueConstraintError`, `ForeignKeyConstraintError`). Use the same pattern when adding endpoints.
  - Attendance has an intended UNIQUE(studentId, date) index. The code will rebuild the table safely if an old UNIQUE(date) index is detected — replicate this caution when changing attendance logic.

- Legacy/compatibility routes
  - There are duplicate/legacy endpoints for compatibility (e.g. `/api/students/:studentId/followups/:id/close` appears multiple times with fallbacks). When refactoring, keep backward-compatible shapes or update all callers.

## Developer workflows (how to run and validate)

- Install dependencies (root and backend):

```powershell
npm install
cd backend; npm install
```

- Start backend server (default port 3000). The backend reads `PORT`, `NODE_ENV`, or `DB_PATH` environment variables in various start scripts; but the simplest is:

```powershell
node backend/index.js
```

- Quick smoke-check after startup: GET `http://localhost:3000/api/backup-status` or `http://localhost:3000/api/students` to confirm the server and DB are wired.

## Integration points and external dependencies

- Sequelize + sqlite3 (configured in `backend/config/database.js`). Many repo scripts use `sqlite3` directly for maintenance.
- Automated backups: folder `automated_backups/` contains backup files and the backend exposes `/api/backup-status` that checks it.
- Cron-like jobs use `node-cron` and various `*.cjs` maintenance scripts scattered at repo root — search for `node-cron` or `auto_backup` when tracking scheduled behavior.

## Small rules for code changes (concrete guidance for an AI agent)

- When changing DB schema: prefer a minimal, targeted ALTER or create-new-table+copy pattern like `ensureAttendanceIndexes` in `backend/index.js` instead of blanket `sync({ alter: true })`.
- Follow the payload normalization convention used in `backend/index.js` (support snake_case and camelCase). Reuse helper patterns from the students endpoints.
- Use transactions for bulk operations (see `/api/students/bulk` which uses `sequelize.transaction()` and rolls back on error).
- Keep compatibility shims for legacy clients (see followups and close endpoints) and log clear warnings when dropping legacy behavior.

## Files to inspect first when debugging or adding features

- `backend/index.js` — startup, migrations, route mounts, and many route handlers (it contains many endpoints in one place).
- `backend/models/*` — model definitions and validations.
- `backend/config/database.js` — DB path and Sequelize options.
- `automated_backups/` — backup storage and naming conventions (server reads these files for `/api/backup-status`).

---
If any section above is unclear or you want more examples (for example: common model fields, a representative route file, or where frontend calls a specific API), tell me which area to expand and I will iterate. 
