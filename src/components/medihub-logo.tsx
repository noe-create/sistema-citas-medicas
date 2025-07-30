'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MedihubLogoProps extends React.SVGProps<SVGSVGElement> {}

export function MedihubLogo({ className, ...props }: MedihubLogoProps) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--success))' }} />
        </linearGradient>
      </defs>
      <path 
        d="M54.4,16.088c-10.8-11.3-34-11.3-44.8,0c-10.8,11.3,0,32.7,22.4,44.001C54.4,48.788,65.2,27.388,54.4,16.088z" 
        fill="url(#logo-gradient)"
      />
      <path 
        d="M32.5,23.5v18" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M23.5,32.5h18" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
