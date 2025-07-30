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
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2A64F5' }} />
          <stop offset="100%" style={{ stopColor: '#00C6B9' }} />
        </linearGradient>
      </defs>
      <path
        d="M32 59.5c15.19 0 27.5-12.31 27.5-27.5S47.19 4.5 32 4.5 4.5 16.81 4.5 32c0 8.76 4.1 16.51 10.53 21.39 1.99 1.51 4.22 2.76 6.53 3.72.76.32 1.54.6 2.33.84 5.33 1.63 11.2-.53 14.8-4.84 2.45-2.94 3.48-6.6 3.01-10.22-.5-3.86-2.81-7.19-5.99-9.1-3.69-2.22-8.1-2.48-12.03-.7-2.62 1.18-4.75 3.42-5.78 6.13-1.04 2.73-.91 5.75.38 8.36 1.77 3.59 5.25 6.01 9.28 6.32 3.86.3 7.55-1.42 9.88-4.32"
        stroke="url(#logo-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
