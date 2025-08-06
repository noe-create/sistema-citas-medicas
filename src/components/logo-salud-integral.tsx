
'use client';

import * as React from 'react';

export function SaludIntegralLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="salud-integral-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: 'rgb(0, 199, 255)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'rgb(0, 123, 255)', stopOpacity: 1 }} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#salud-integral-gradient)" strokeWidth="10" />
      <path d="M 50,50 m -20,0 a 20,20 0 1,1 40,0 a 20,20 0 1,1 -40,0" fill="none" stroke="url(#salud-integral-gradient)" strokeWidth="8" strokeLinecap="round" transform="rotate(-45 50 50)" />
    </svg>
  );
}
