'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

export function LogoSaludIntegral({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 160 80"
      className={cn("h-auto", className)}
      {...props}
    >
      <g fill="currentColor">
        <text x="50" y="45" fontFamily="serif" fontSize="48" fontWeight="bold">S</text>
        <circle cx="68" cy="22" r="5" />
        <circle cx="28" cy="62" r="5" />
        <text x="8" y="75" fontFamily="sans-serif" fontSize="10">Salud Integral la Viña</text>
      </g>
    </svg>
  );
}
