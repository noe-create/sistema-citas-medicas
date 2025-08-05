'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

export function LogoCPV({ className, ...props }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 80"
      className={cn("h-auto", className)}
      {...props}
      fill="currentColor"
    >
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Teko:wght@700&display=swap');
          `}
        </style>
        <text 
            x="5" 
            y="60" 
            fontFamily="'Teko', sans-serif" 
            fontSize="80" 
            fontWeight="bold"
            fill="#F59E0B"
        >
            FC
        </text>
    </svg>
  );
}
