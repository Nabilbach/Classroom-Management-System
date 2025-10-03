import React from 'react';
import { Typography, Box } from '@mui/material';
import { FaBookOpen } from 'react-icons/fa';

const EmptyLessonLogsState: React.FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={2}
      textAlign="center"
      color="text.secondary"
    >
      <FaBookOpen size={64} color="#bdbdbd" />
      <Typography variant="h6" component="p" mt={2}>
        لا توجد دروس مسجلة بعد.
      </Typography>
      <Typography variant="body2" component="p" mt={1}>
        ابدأ بإضافة درس جديد باستخدام النموذج أعلاه.
      </Typography>
    </Box>
  );
};

export default EmptyLessonLogsState;
