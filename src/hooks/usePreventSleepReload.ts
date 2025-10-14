import { useEffect, useRef } from 'react';

export function usePreventSleepReload(maxInactivityMs = 60 * 60 * 1000) {
  const lastActiveTime = useRef<number>(Date.now());
  const reconnectAttempts = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const inactiveTime = Date.now() - lastActiveTime.current;

        // If inactivity was short, avoid full page reload and try a soft reconnect
        if (inactiveTime < maxInactivityMs) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            await fetch('/api/health', { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeout);
            reconnectAttempts.current = 0;
            // successful soft reconnect
          } catch (err) {
            reconnectAttempts.current += 1;
            // after several failed attempts, let other UI handle notifying the user
          }
        } else {
          // long inactivity - optionally notify user that refresh may be needed
          // do nothing here to avoid forcing a reload
        }
      } else {
        lastActiveTime.current = Date.now();
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      // When page is restored from BFCache, avoid full reload
      if (e && (e as any).persisted) {
        // keep state
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow as EventListener);
    };
  }, [maxInactivityMs]);

  return { lastActiveTime: lastActiveTime.current };
}
