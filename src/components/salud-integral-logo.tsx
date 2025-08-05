
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SaludIntegralLogoProps extends React.SVGProps<SVGSVGElement> {}

// This is a placeholder representation of the logo from the image.
// A more accurate SVG could be used if available.
export function SaludIntegralLogo({ className, ...props }: SaludIntegralLogoProps) {
  return (
    <svg 
        width="150" 
        height="75" 
        viewBox="0 0 150 75" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className)}
      {...props}
    >
        <text 
            x="5" 
            y="45" 
            fontFamily="'Brush Script MT', cursive" 
            fontSize="48" 
            fill="currentColor"
        >
            S
        </text>
        <circle cx="20" cy="55" r="3" fill="currentColor"/>
        <circle cx="53" cy="18" r="3" fill="currentColor"/>
        
        <text x="65" y="28" fontFamily="sans-serif" fontSize="12" fill="currentColor">Salud Integral</text>
        <text x="80" y="42" fontFamily="sans-serif" fontSize="12" fill="currentColor">la Viña</text>
        
        <text x="30" y="68" fontFamily="sans-serif" fontSize="6" fill="currentColor">Centro Policlínico Valencia, C.A.</text>

        {/* Family Icon Placeholder */}
        <path d="M75 50 L 78 45 L 81 50 Z M 80 50 L 80 55" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M85 50 L 88 45 L 91 50 Z M 90 50 L 90 55" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M95 52 L 97 48 L 99 52 Z M 98 52 L 98 55" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M102 52 L 104 48 L 106 52 Z M 105 52 L 105 55" stroke="currentColor" strokeWidth="0.8" fill="none" />

        <g transform="translate(15, 28)">
            <circle cx="15" cy="15" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <text x="12" y="19" fontFamily="serif" fontSize="12" fontWeight="bold" fill="currentColor">&amp;</text>
        </g>
    </svg>
  );
}
