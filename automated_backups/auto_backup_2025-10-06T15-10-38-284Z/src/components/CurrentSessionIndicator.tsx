import React from 'react';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { Typography, Box, CircularProgress } from '@mui/material';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
`;

const StatusCircle = ({ active }: { active: boolean }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: active ? '#ff5252' : '#9e9e9e',
            animation: active ? `${pulse} 2s infinite` : 'none',
      marginRight: 2, // For RTL layout
    }}
  />
);

const CurrentSessionIndicator: React.FC = () => {
  const { currentSession, nextSession, isLoading } = useCurrentSession();

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" p={1} border="1px solid #e0e0e0" borderRadius={4} minHeight={40}>
        <CircularProgress size={16} sx={{ ml: 2 }} />
        <Typography variant="body2" color="textSecondary">
          جار التحقق من حالة الحصة...
        </Typography>
      </Box>
    );
  }

  const renderContent = () => {
    if (currentSession) {
      return (
        <Typography variant="body2" color="textPrimary" component="div">
          في حصة مع <strong>{currentSession.sectionName}</strong> إلى غاية {currentSession.endTime}
        </Typography>
      );
    }
    if (nextSession) {
      return (
        <Typography variant="body2" color="textSecondary">
          الحصة القادمة مع <strong>{nextSession.sectionName}</strong> على الساعة {nextSession.startTime}
        </Typography>
      );
    }
    return (
      <Typography variant="body2" color="textSecondary">
        لا توجد حصص متبقية اليوم
      </Typography>
    );
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="flex-start" p={1} border="1px solid #e0e0e0" borderRadius={4} minHeight={40}>
      <StatusCircle active={!!currentSession} />
      {renderContent()}
    </Box>
  );
};

export default CurrentSessionIndicator;

