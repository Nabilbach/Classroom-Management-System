# Environment Separation & Safety Guidelines

## Overview
This document outlines how development and production environments are separated and protected in the Classroom Management System.

## Environment Structure

### Production Environment (`classroom.db`)
- **Database**: `classroom.db` (production data only)
- **Backend Port**: 3000
- **Frontend Port**: 5173
- **Configuration**: `.env` (default)
- **Node Environment**: `production`
- **Used By**: 
  - Electron desktop app (final product)
  - `npm run prod:backend` and `npm run prod:frontend`

### Development Environment (`classroom_dev.db`)
- **Database**: `classroom_dev.db` (test/dummy data)
- **Backend Port**: 3001
- **Frontend Port**: 5174
- **Configuration**: `.env.development`
- **Node Environment**: `development`
- **Used By**: 
  - Local development servers
  - `npm run dev:backend` and `npm run dev:frontend`
  - Web browser testing

## Configuration Files

### `.env.development`
```dotenv
NODE_ENV=development
PORT=3001
DB_PATH=classroom_dev.db
APP_NAME="Classroom Management System - Development"
VITE_API_URL=http://localhost:3001
VITE_APP_ENV=development
```

### `.env` (Production)
```dotenv
NODE_ENV=production
PORT=3000
DB_PATH=classroom.db
APP_NAME="Classroom Management System"
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=production
```

## Database Configuration

The `backend/config/database.js` file now dynamically reads the `DB_PATH` environment variable:

```javascript
// Uses DB_PATH from environment, defaults to classroom.db (production)
const dbPath = process.env.DB_PATH || 'classroom.db';
const dbFilePath = path.join(__dirname, '..', '..', dbPath);
```

**Key Points:**
- ✅ When `NODE_ENV=development`, uses `classroom_dev.db`
- ✅ When `NODE_ENV=production`, uses `classroom.db`
- ✅ Default fallback is always `classroom.db` (production-safe)

## Seed Script Protection

The `seed_dev_data.cjs` script now includes safety checks:

```javascript
// Safety check: Prevent running on production database
const ENV = process.env.NODE_ENV || 'development';
const isProduction = ENV === 'production' || process.env.DATABASE_PATH?.includes('classroom.db');

if (isProduction) {
  console.error('❌ SAFETY ERROR: Refusing to seed production database!');
  process.exit(1);
}
```

**Safeguards:**
1. ✅ Checks `NODE_ENV` environment variable
2. ✅ Refuses to run if environment is `production`
3. ✅ Checks for `classroom.db` in database path
4. ✅ Provides clear error messages when blocked

## Running Development & Production

### Start Development Server (uses `classroom_dev.db`)
```bash
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

Then access: `http://localhost:5174`

### Seed Development Database
```bash
cd backend
NODE_ENV=development node ../seed_dev_data.cjs
```

### Start Production Server (uses `classroom.db`)
```bash
npm run prod:backend    # Terminal 1
npm run prod:frontend   # Terminal 2
```

Or launch the Electron app for production use.

## What Gets Protected

| Action | Dev Env | Prod Env | Protected |
|--------|---------|----------|-----------|
| `seed_dev_data.cjs` | ✅ Runs | ❌ Blocked | ✅ Yes |
| Database writes | `classroom_dev.db` | `classroom.db` | ✅ Yes |
| API requests | Port 3001 | Port 3000 | ✅ Yes |
| Test data | Included | None | ✅ Yes |

## Safety Checklist

Before running any operation:

- [ ] Verify current environment: `echo $env:NODE_ENV` (PowerShell) or `echo $NODE_ENV` (Bash)
- [ ] Check which database you're targeting: `echo $env:DB_PATH`
- [ ] Confirm frontend port: Development = 5174, Production = 5173
- [ ] For seeding: Only run `seed_dev_data.cjs` with `NODE_ENV=development`

## Recent Changes (Security Hardening)

✅ **Modified Files:**
1. `.env` - Added environment variables for production
2. `.env.development` - Explicitly set development variables
3. `backend/config/database.js` - Now uses `DB_PATH` from environment
4. `seed_dev_data.cjs` - Added production safeguards

✅ **Production Data:**
- `classroom.db` cleaned of test data
- Only 9 legitimate sections remain
- No seed/dummy data in production

## Troubleshooting

### Issue: Seed script still warns about production
**Solution:** Ensure `NODE_ENV=development` is set before running the script

```bash
$env:NODE_ENV='development'; node seed_dev_data.cjs
```

### Issue: Connected to wrong database
**Solution:** Check your environment configuration
```bash
echo "NODE_ENV: $env:NODE_ENV"
echo "DB_PATH: $env:DB_PATH"
```

### Issue: Changes not reflecting
**Solution:** Stop all running servers and restart with correct environment
```bash
# Kill existing processes and restart
npm run dev:backend  # or prod:backend
```

## Future Enhancements

- Add database backup/restore automation for dev
- Implement environment validation in build pipeline
- Add CI/CD checks to prevent seed script execution in production
- Auto-reset development database on new feature branches
