# Attendance System (central)

Quick start (development):

1. Install deps for central frontend:

```powershell
cd attendance-system/central-frontend
npm install
```

2. Install deps for backend:

```powershell
cd attendance-system/backend
npm install
```

3. Run backend and frontend separately or together:

```powershell
# backend only
node attendance-system/backend/index.js

# frontend only
cd attendance-system/central-frontend
npm run dev

# or from attendance-system root (requires concurrently)
cd attendance-system
npm install
npm run start:all
```

Security notes:
- Current CORS settings are permissive for development. Lock them down in production to a strict whitelist.
- Admin endpoints `/api/admin/*` require authentication. `assign-sections` and `create-instance` are restricted to admin or owner by JWT role checks.
- The `teacher-instances` folder is created in the project root when instances are generated. Ensure filesystem permissions are set appropriately.

