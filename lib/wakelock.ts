import { useState, useEffect } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const request = async () => {
    if (!isSupported) return false;
    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      console.log('Wake Lock is active!');
      return true;
    } catch (err) {
      console.error(`Wake Lock error: ${err}`);
      return false;
    }
  };

  const release = async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      console.log('Wake Lock released!');
    }
  };

  // Re-request wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      release(); // cleanup on unmount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeLock]);

  return { isSupported, isActive: wakeLock !== null, request, release };
}
