<<<<<<< HEAD
import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
=======
// Re-export the central StudentsContext to avoid duplicate context instances.
// This file exists only to preserve import paths under `src/features/...` used elsewhere
// and forwards everything to the single implementation in `src/contexts/StudentsContext.tsx`.
>>>>>>> feature/student-evaluation-system

export { StudentsProvider, useStudents } from '../../../contexts/StudentsContext';
