'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CpvLogoProps extends React.SVGProps<SVGSVGElement> {}

export function CpvLogo({ className, ...props }: CpvLogoProps) {
  return (
    <svg
      width="80"
      height="40"
      viewBox="0 0 130 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <defs>
        <linearGradient id="cpv-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#005f9e" />
          <stop offset="100%" stopColor="#00a9a3" />
        </linearGradient>
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
          <feOffset dx="1" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#drop-shadow)">
        <path
          d="M40.33 5.09C27.96 5.09 18.91 14.14 18.91 26.51V38.96C18.91 51.33 27.96 60.38 40.33 60.38H42.71V5.09H40.33Z"
          fill="url(#cpv-gradient)"
        />
        <path
          d="M42.71 31.95C42.71 19.58 51.76 10.53 64.13 10.53C76.5 10.53 85.55 19.58 85.55 31.95C85.55 44.32 76.5 53.37 64.13 53.37C51.76 53.37 42.71 44.32 42.71 31.95Z"
          fill="url(#cpv-gradient)"
        />
        <path
          d="M85.55 5.09V60.38H106.3C116.15 60.38 124.78 54.08 124.78 45.42V20.04C124.78 11.38 116.15 5.09 106.3 5.09H85.55Z"
          fill="url(#cpv-gradient)"
        />
      </g>
    </svg>
  );
}
