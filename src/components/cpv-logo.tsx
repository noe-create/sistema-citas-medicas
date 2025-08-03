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
          <feOffset in="blur" dx="3" dy="3" result="offsetBlur"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#drop-shadow)">
        <path
          d="M108.7,47.9c0-14.4-11.7-26.1-26.1-26.1H50.9C31.7,21.8,16,37.5,16,56.7v36.6C16,104.5,23.5,112,32,112 h14.3c-4.4-4.8-7-11.1-7-18.1c0-14.4,11.7-26.1,26.1-26.1h33.3V47.9z"
          fill="#FDB813"
        />
        <path
          d="M139.6,47.9v20.9h-30.5c-8.9,0-16.1,7.2-16.1,16.1c0,8.9,7.2,16.1,16.1,16.1h5.8l25.1-43.4L139.6,47.9z"
          fill="#FDB813"
        />
        <path
          d="M125.1,112L98.5,66.1h-5.8c-14.4,0-26.1-11.7-26.1-26.1V21.8h31.7c19.2,0,34.7,15.5,34.7,34.7v25.8L158.1,112h-33V112z"
          fill="#FDB813"
        />
      </g>
      <text x="10" y="135" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#333">
        CENTRO POLITÉCNICO VALENCIA, "LA VIÑA"
      </text>
    </svg>
  );
}
