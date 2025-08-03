
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CpvLogoProps extends React.SVGProps<SVGSVGElement> {}

export function CpvLogo({ className, ...props }: CpvLogoProps) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={cn(className)}
      {...props}
    >
      <defs>
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
          <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
         <linearGradient id="cpv-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FDB813" />
          <stop offset="100%" stopColor="#F9A52B" />
        </linearGradient>
      </defs>
      <g filter="url(#drop-shadow)">
        <path
          d="M108.7,47.9c0-14.4-11.7-26.1-26.1-26.1H50.9C31.7,21.8,16,37.5,16,56.7v36.6C16,104.5,23.5,112,32,112 h14.3c-4.4-4.8-7-11.1-7-18.1c0-14.4,11.7-26.1,26.1-26.1h33.3V47.9z"
          fill="url(#cpv-gradient)"
        />
        <path
          d="M93.8,68.7H92.5c-8.9,0-16.1,7.2-16.1,16.1s7.2,16.1,16.1,16.1h5.8L125.1,112h33l-25.1-43.4L93.8,68.7z"
          fill="url(#cpv-gradient)"
        />
      </g>
       <text x="50%" y="140" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#333" textAnchor="middle">
        CENTRO POLITÉCNICO VALENCIA, "LA VIÑA"
      </text>
    </svg>
  );
}
