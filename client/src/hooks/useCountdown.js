import { useState, useEffect } from 'react';

export const useCountdown = (session) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [percentageElapsed, setPercentageElapsed] = useState(0);

  useEffect(() => {
    if (!session || session.status !== 'LIVE') {
      // Default to total session duration in seconds
      const totalSec = (session?.durationMinutes || 30) * 60;
      setSecondsRemaining(totalSec);
      setIsOvertime(false);
      setPercentageElapsed(0);
      return;
    }

    const totalSeconds = session.durationMinutes * 60;
    const startTime = session.actualStartTime ? new Date(session.actualStartTime) : new Date();

    const tick = () => {
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remaining = totalSeconds - elapsedSeconds;

      setSecondsRemaining(remaining);
      setIsOvertime(remaining < 0);

      const percent = Math.min(100, Math.max(0, Math.floor((elapsedSeconds / totalSeconds) * 100)));
      setPercentageElapsed(percent);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [session]);

  return {
    secondsRemaining,
    isOvertime,
    percentageElapsed
  };
};
