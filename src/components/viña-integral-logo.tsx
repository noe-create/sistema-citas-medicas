
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ViñaIntegralLogoProps extends React.SVGProps<SVGSVGElement> {}

export function ViñaIntegralLogo({ className, ...props }: ViñaIntegralLogoProps) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <circle cx="50" cy="50" r="48" fill="url(#paint0_linear_1_2)" stroke="#E0E0E0" strokeWidth="4"/>
      <defs>
        <linearGradient id="paint0_linear_1_2" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5F5F5"/>
          <stop offset="1" stopColor="#E0E0E0"/>
        </linearGradient>
      </defs>
      <path d="M50 38C46.6863 38 44 40.6863 44 44C44 47.3137 46.6863 50 50 50C53.3137 50 56 47.3137 56 44C56 40.6863 53.3137 38 50 38Z" fill="#3A7D44"/>
      <path d="M60 52C60 48.6863 57.3137 46 54 46C50.6863 46 48 48.6863 48 52H60Z" fill="#3A7D44"/>
      <path d="M40 52C40 48.6863 42.6863 46 46 46C49.3137 46 52 48.6863 52 52H40Z" fill="#3A7D44"/>
      <path d="M50 54C46 54 42.5 57 42.5 62H57.5C57.5 57 54 54 50 54Z" fill="#3A7D44"/>
    </svg>
  );
}
