# Quick Reference Guide - Development Environment

## Start Development Environment

### Option 1: Backend Only
```bash
npm run dev:backend
# Backend runs on: http://localhost:4201
# Database: classroom_dev.db (synchronized with production)
```

### Option 2: Frontend Only  
```bash
npm run dev:frontend
# Frontend runs on: http://localhost:4201 (Vite dev server)
```

### Option 3: Backend + Frontend (Recommended)
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

---

## API Testing

### Test Lesson Templates Endpoint
```bash
curl http://localhost:4201/api/lesson-templates
```

### Get Specific Template
```bash
curl http://localhost:4201/api/lesson-templates/{id}
```

### Create New Template
```bash
curl -X POST http://localhost:4201/api/lesson-templates \
  -H "Content-Type: application/json" \
  -d '{"title":"New Lesson","objectives":["Objective 1"]}'
```

---

## Database Management

### Check Database Sync Status
```bash
# Compare file sizes (should be identical)
ls -lh classroom.db classroom_dev.db

# Check record count
sqlite3 classroom_dev.db "SELECT COUNT(*) FROM LessonTemplates;"
```

### Re-sync if Needed
```bash
# Copy production to development
cp classroom.db classroom_dev.db
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
netstat -tuln | grep 4201

# Kill existing process
taskkill /F /IM node.exe
```

### Database Lock Issues
```bash
# Close any existing connections and try again
taskkill /F /IM node.exe
npm run dev:backend
```

### Templates Not Loading
1. Verify database sync: `ls -lh *.db`
2. Check backend logs for errors
3. Verify API endpoint is accessible: `curl http://localhost:4201/api/lesson-templates`

---

## Learning Management Features

### Available in Development Now
✅ SmartCalendar - View/schedule lessons  
✅ Lesson Log - Track lesson progress  
✅ CurriculumTab - Advanced lesson management with drag & drop  
✅ 68 Lesson Templates - All synchronized from production  

### How to Access
1. Start both backend and frontend
2. Navigate to Learning Management page
3. Select tab for desired view
4. All 68 templates should be available

---

## Environment Variables

### Development (.env.development)
```
PORT=4201
DATABASE=classroom_dev.db
NODE_ENV=development
```

### Production (.env)
```
PORT=4200
DATABASE=classroom.db
NODE_ENV=production
```

---

## Useful Commands

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only  
npm run test:frontend

# Build for production
npm run build

# Preview production build
npm run preview

# Backup current database
npm run backup:immediate

# Check backup status
npm run backup:status
```

---

## File Structure Reference

```
project-root/
├── backend/
│   ├── index.dev.js          # Development server (port 4201)
│   ├── index.js              # Production server (port 4200)
│   ├── models/
│   │   ├── lessonTemplate.js
│   │   └── lessonLog.js
│   └── routes/
│       ├── lessonTemplatesRoutes.js
│       ├── lessonLogs.js
│       └── ...
├── src/
│   ├── pages/LearningManagement.tsx
│   ├── components/
│   │   ├── SmartCalendar.tsx
│   │   ├── CurriculumTab.tsx
│   │   └── ...
│   └── contexts/LessonLogContext.tsx
├── classroom.db              # Production database (1.15 MB)
└── classroom_dev.db          # Development database (1.15 MB - synchronized)
```

---

## Status Check

### Verify Development Environment Ready
```bash
# 1. Check databases exist and are same size
ls -lh classroom*.db

# 2. Start backend
npm run dev:backend

# 3. In another terminal, verify API works
curl http://localhost:4201/api/lesson-templates

# 4. Count templates (should be 68)
curl http://localhost:4201/api/lesson-templates | jq '. | length'
```

---

**Last Updated**: December 5, 2025  
**Status**: ✅ All systems operational  
**Templates Available**: 68/68 synchronized
