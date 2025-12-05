# 🚀 Quick Start Guide - After Infrastructure Cleanup

## Current System State
✅ Production database cleaned  
✅ Environment separation implemented  
✅ Safeguards in place  
✅ Ready for development  

## Starting Development

### Option 1: Quick Start (Recommended)
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Open browser: http://localhost:5174
```

### Option 2: Seed Development Database First
```bash
# Only do this if you want test data in development
cd backend
NODE_ENV=development node ../seed_dev_data.cjs

# Then start servers as above
```

### Option 3: Production Mode
```bash
# Terminal 1 - Backend (Production)
npm run prod:backend

# Terminal 2 - Frontend (Production)
npm run prod:frontend

# Open browser: http://localhost:5173
```

## Port Reference
- **Development Backend**: 3001
- **Development Frontend**: 5174
- **Production Backend**: 3000
- **Production Frontend**: 5173

## Database Reference
- **Development**: `classroom_dev.db` (test data, can be reset)
- **Production**: `classroom.db` (real data, protected)

## Important Safety Notes

⚠️ **Never** run `seed_dev_data.cjs` with `NODE_ENV=production`  
⚠️ **Always** verify your environment before running major operations  
⚠️ Production database is now **protected** from seed scripts  

### Check Your Environment
```bash
# PowerShell
echo $env:NODE_ENV
echo $env:DB_PATH

# Bash
echo $NODE_ENV
echo $DB_PATH
```

## Next Steps

### 1. Test the Environment Setup
```bash
node test_environment_separation.cjs
```

### 2. Read Documentation
- `ENVIRONMENT_SEPARATION_GUIDE.md` - Full reference
- `CLEANUP_COMPLETION_SUMMARY.md` - What was done

### 3. Start Your Feature Work
- Development database is ready for testing
- Production data is safe
- All safeguards are active

## Troubleshooting

**Problem**: Backend on wrong port  
**Solution**: Verify `NODE_ENV` and restart

**Problem**: Using wrong database  
**Solution**: Check `.env` or `.env.development` files

**Problem**: Seed script won't run  
**Solution**: Make sure `NODE_ENV=development` is set

## Common Commands

```bash
# Check environment
npm run info  # if available

# Start fresh development
npm run dev:backend & npm run dev:frontend

# Stop all processes
# In terminal: Ctrl+C twice

# Check git status
git status

# See recent commits
git log --oneline -5
```

---

Ready to work on Learning Progress Hub improvements! 🎯
