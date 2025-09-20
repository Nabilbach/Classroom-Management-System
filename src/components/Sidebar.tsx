import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { FaHome, FaUsers, FaThLarge, FaCalendarAlt, FaChartBar, FaChartLine, FaCog } from 'react-icons/fa';

function Sidebar() {
  return (
    <Box
      sx={{
        width: { xs: 220, sm: 240, md: 260 },
        minWidth: 200,
        maxWidth: 300,
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        backgroundColor: '#1976d2',
        color: 'white',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        boxShadow: '-2px 0 6px rgba(0,0,0,0.2)',
        direction: 'rtl',
        fontFamily: 'Arial, sans-serif',
        overflowY: 'auto',
        zIndex: 100,
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
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaHome style={{ color: 'white', marginRight: '8px' }} /> لوحة القيادة
          </Button>
        </Link>

        <Link to="/student-management" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaUsers style={{ color: 'white', marginRight: '8px' }} /> إدارة التلاميذ
          </Button>
        </Link>

        <Link to="/section-management" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaThLarge style={{ color: 'white', marginRight: '8px' }} /> إدارة الأقسام
          </Button>
        </Link>

        <Link to="/schedule" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaCalendarAlt style={{ color: 'white', marginLeft: '8px' }} /> الجدول الزمني
          </Button>
        </Link>

        <Link to="/learning-progress" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
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
            <FaChartBar style={{ color: 'white', marginLeft: '8px' }} /> التقدم والتعلم
          </Button>
        </Link>

        <Link to="/statistics-and-reports" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaChartLine style={{ color: 'white', marginLeft: '8px' }} /> الإحصائيات والتقارير
          </Button>
        </Link>

        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <Button
            fullWidth
            sx={{
              justifyContent: 'flex-end',
              color: 'white',
              py: 1.2,
              fontSize: '1rem',
              borderRadius: 1,
              mb: 1,
              ':hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <FaCog style={{ color: 'white', marginLeft: '8px' }} /> الإعدادات
          </Button>
        </Link>
      </Box>
    </Box>
  );
}

export default Sidebar;