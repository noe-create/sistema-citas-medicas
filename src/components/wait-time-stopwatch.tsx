'use client';

import * as React from 'react';

interface WaitTimeStopwatchProps {
  startTime: Date;
}

export function WaitTimeStopwatch({ startTime }: WaitTimeStopwatchProps) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const totalSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  if (totalSeconds < 0) return <span>00:00</span>;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  return <span className="font-mono">{formattedTime}</span>;
}
