'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

interface RealTimeClockProps {
  className?: string;
}

export function RealTimeClock({ className }: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // This runs only on the client, after the initial render.
    setCurrentTime(new Date());

    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []); // Empty dependency array ensures this runs once on mount.

  // e.g., "sábado, 25 de mayo de 2024"
  const formattedDate = currentTime ? format(currentTime, "PPPP", { locale: es }) : 'Cargando fecha...';
  // e.g., "01:30:05 PM"
  const formattedTime = currentTime ? format(currentTime, "hh:mm:ss a", { locale: es }) : '--:--:-- --';

  return (
    <div className={cn("flex flex-col sm:flex-row items-baseline sm:items-center gap-x-6 gap-y-1 font-mono mt-2", className)}>
        <div className="flex items-center gap-2 text-lg text-muted-foreground">
            <Calendar className="h-5 w-5"/>
            <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2.5 text-primary">
            <Clock className="h-7 w-7"/>
            <span className="text-4xl font-bold tracking-wider">{formattedTime}</span>
        </div>
    </div>
  );
}
