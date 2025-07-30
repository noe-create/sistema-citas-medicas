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
        <linearGradient id="logo-gradient-component" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--success))' }} />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 59.5C48.42 59.5 54 41.5 54 32C54 22.5 48.42 4.5 32 4.5C15.58 4.5 10 22.5 10 32C10 41.5 15.58 59.5 32 59.5Z"
        fill="url(#logo-gradient-component)"
      />
      <path
        d="M32 20V44M20 32H44"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
