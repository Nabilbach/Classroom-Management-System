import { useEffect, useState } from 'react';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showStatus, setShowStatus] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('/api/health', { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkConnection, 30000);

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkConnection();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // initial check
    checkConnection();

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <Fade in={showStatus || !isOnline}>
      <Chip
        icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
        label={isOnline ? 'متصل بالخادم' : 'انقطع الاتصال بالخادم'}
        color={isOnline ? 'success' : 'error'}
        size="small"
        sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9999, boxShadow: 3 }}
      />
    </Fade>
  );
}
