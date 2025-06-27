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
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  // e.g., "25 de mayo de 2024"
  const formattedDate = format(time, "PPP", { locale: es });
  // e.g., "12:00:30 p. m."
  const formattedTime = format(time, "pp", { locale: es });

  return (
    <div className={cn("flex items-center gap-4 text-base text-muted-foreground font-mono mt-1", className)}>
        <div className="flex items-center gap-1.5">
            <Calendar className="h-5 w-5"/>
            <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
            <Clock className="h-5 w-5"/>
            <span>{formattedTime}</span>
        </div>
    </div>
  );
}
