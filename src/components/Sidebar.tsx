import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

function Sidebar() {
  return (
    <Box
      sx={{
        width: 250,
        height: '100vh',
        backgroundColor: '#1976d2',
        color: 'white',
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
        direction: 'rtl',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* عنوان التطبيق */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          color: 'white',
          mb: 4,
          textAlign: 'center',
          width: '100%',
        }}
      >
        نظام إدارة الصف
      </Typography>

      {/* القائمة */}
      <Box component="nav" sx={{ mt: 2, width: '100%' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            🏠 لوحة القيادة
          </Button>
        </Link>

        <Link to="/student-management" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            👥 إدارة التلاميذ
          </Button>
        </Link>

        <Link to="/section-management" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            🧩 إدارة الأقسام
          </Button>
        </Link>

        <Link to="/schedule" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            🗓️ الجدول الزمني
          </Button>
        </Link>

        <Link to="/learning-progress" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: '#fff',
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: '#d32f2f',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: '#b71c1c' },
            }}
          >
            📊 التقدم والتعلم
          </Button>
        </Link>

        <Link to="/statistics-and-reports" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            📈 الإحصائيات والتقارير
          </Button>
        </Link>

        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'right',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            ⚙️ الإعدادات
          </Button>
        </Link>
      </Box>
    </Box>
  );
}

export default Sidebar;