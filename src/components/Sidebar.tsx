import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Button, Typography, IconButton, Tooltip } from '@mui/material';
import { FaHome, FaUsers, FaThLarge, FaCalendarAlt, FaChartBar, FaChartLine, FaCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: FaHome, label: 'لوحة القيادة' },
    { path: '/student-management', icon: FaUsers, label: 'إدارة التلاميذ' },
    { path: '/section-management', icon: FaThLarge, label: 'إدارة الأقسام' },
    { path: '/schedule', icon: FaCalendarAlt, label: 'الجدول الزمني' },
    { path: '/learning-progress', icon: FaChartBar, label: 'إدارة التعلم' },
    { path: '/statistics-and-reports', icon: FaChartLine, label: 'الإحصائيات والتقارير' },
    { path: '/settings', icon: FaCog, label: 'الإعدادات' },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? 80 : { xs: 220, sm: 240, md: 260 },
        minWidth: collapsed ? 80 : 200,
        maxWidth: collapsed ? 80 : 300,
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
        direction: 'rtl',
        fontFamily: 'Cairo, Arial, sans-serif',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: 3,
        },
      }}
    >
      {/* Header with collapse button */}
      <Box sx={{ 
        p: collapsed ? 1 : 3, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexDirection: 'row-reverse', // RTL for header
      }}>
        <IconButton
          onClick={toggleCollapse}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
            mr: collapsed ? 0 : 1,
          }}
        >
          {collapsed ? <FaChevronLeft /> : <FaChevronRight />}
        </IconButton>

        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'right',
              fontSize: '1.1rem',
              fontFamily: 'Cairo, Arial, sans-serif',
              flex: 1,
            }}
          >
            نظام إدارة الصف
          </Typography>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box component="nav" sx={{ 
        mt: 2, 
        width: '100%', 
        px: collapsed ? 0.5 : 2,
        flex: 1,
      }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <Tooltip 
              key={item.path}
              title={collapsed ? item.label : ''}
              placement="left"
              arrow
            >
              <Link to={item.path} style={{ textDecoration: 'none' }}>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: collapsed ? 'center' : 'flex-start', // Changed to flex-start for RTL
                    color: active ? '#fff' : 'rgba(255,255,255,0.9)',
                    py: 1.5,
                    px: collapsed ? 1 : 2,
                    fontSize: collapsed ? 0 : '0.95rem',
                    fontWeight: active ? 'bold' : 'normal',
                    borderRadius: 2,
                    mb: 1,
                    minHeight: 48,
                    background: active 
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)'
                      : item.highlight 
                        ? 'linear-gradient(90deg, #d32f2f 0%, #f44336 100%)'
                        : 'transparent',
                    border: active ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    transform: active ? 'translateX(2px)' : 'translateX(0)', // Changed direction for RTL
                    boxShadow: active 
                      ? '0 4px 12px rgba(0,0,0,0.2)' 
                      : item.highlight 
                        ? '0 2px 8px rgba(211,47,47,0.3)'
                        : 'none',
                    '&:hover': {
                      bgcolor: active 
                        ? 'rgba(255,255,255,0.25)' 
                        : item.highlight 
                          ? '#b71c1c'
                          : 'rgba(255,255,255,0.15)',
                      transform: 'translateX(4px) scale(1.02)', // Changed direction for RTL
                      boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: active ? 0 : -100,
                      width: 4,
                      height: '100%',
                      backgroundColor: '#fff',
                      transition: 'right 0.3s ease',
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: collapsed ? 0 : 1.5, // مسافة مناسبة بين العناصر
                    width: '100%',
                    justifyContent: collapsed ? 'center' : 'flex-end', // تغيير إلى flex-start لإزالة المسافة الكبيرة
                    flexDirection: 'row-reverse', // استخدام row-reverse لترتيب RTL صحيح
                  }}>
                    {!collapsed && (  
                      <Typography
                        sx={{
                          fontFamily: 'Cairo, Arial, sans-serif',
                          fontSize: '0.95rem',
                          fontWeight: active ? 'bold' : 'normal',
                          textShadow: active ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          textAlign: 'right',
                        }}
                      >
                        {item.label}
                      </Typography>
                    )}
                    <IconComponent 
                      size={collapsed ? 20 : 18}
                      style={{ 
                        color: active ? '#fff' : 'rgba(255,255,255,0.9)',
                        filter: active ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                      }} 
                    />
                  </Box>
                </Button>
              </Link>
            </Tooltip>
          );
        })}
      </Box>

      {/* Footer */}
      {!collapsed && (
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'Cairo, Arial, sans-serif'
            }}
          >
            الإصدار 1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Sidebar;