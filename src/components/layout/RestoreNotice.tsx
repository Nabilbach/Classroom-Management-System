import React, { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useStudents } from '../../contexts/StudentsContext';

export default function RestoreNotice() {
  const { restoredFromCache } = useStudents() as any;
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (restoredFromCache) {
      setOpen(true);
      // Clear flag after showing
      setTimeout(() => setOpen(false), 6000);
    }
  }, [restoredFromCache]);

  return (
    <Snackbar open={open} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert severity="info" sx={{ width: '100%' }}>
        تم استعادة بيانات الطلاب من الذاكرة المؤقتة. يتم الآن تحديث البيانات في الخلفية.
      </Alert>
    </Snackbar>
  );
}
