
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
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A64F5"/>
          <stop offset="1" stopColor="#38BDF8"/>
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM50 88C70.9868 88 88 70.9868 88 50C88 29.0132 70.9868 12 50 12C29.0132 12 12 29.0132 12 50C12 70.9868 29.0132 88 50 88Z"
        fill="url(#logo-gradient)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 78C62.6929 78 73 67.6929 73 55C73 45.8197 67.4695 37.9377 59.4316 35.3053C58.8227 35.0888 58.1724 35 57.5 35H42.5C41.8276 35 41.1773 35.0888 40.5684 35.3053C32.5305 37.9377 27 45.8197 27 55C27 67.6929 37.3071 78 50 78ZM50 67C56.6274 67 62 61.6274 62 55C62 48.3726 56.6274 43 50 43C43.3726 43 38 48.3726 38 55C38 61.6274 43.3726 67 50 67Z"
        fill="url(#logo-gradient)"
      />
    </svg>
  );
}
