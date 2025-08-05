
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CpvLogoProps extends React.SVGProps<SVGSVGElement> {}

export function CpvLogo({ className, ...props }: CpvLogoProps) {
  return (
    <svg
      width="65"
      height="50"
      viewBox="0 0 65 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <path
        d="M64.24 23.36V10.16H51.44V0.559998H13.2V10.16H0.400002V39.52H13.2V49.12H51.44V39.52H38.64V23.36H64.24ZM13.2 23.36H25.36V10.16H13.2V23.36Z"
        fill="#FF8C00"
      />
    </svg>
  );
}
