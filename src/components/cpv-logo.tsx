
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CpvLogoProps extends React.SVGProps<SVGSVGElement> {}

export function CpvLogo({ className, ...props }: CpvLogoProps) {
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
        <g clipPath="url(#clip0_2_2)">
            <path d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100Z" fill="url(#paint0_linear_2_2)"></path>
            <path d="M54.269 38.5645L49.535 44.5945C49.535 44.5945 49.535 44.5945 49.535 44.5945L45.483 38.5645C39.673 38.5645 35.181 43.0565 35.181 48.8665C35.181 54.6765 39.673 59.1685 45.483 59.1685H54.212C59.909 59.1685 64.514 54.5635 64.514 48.8665C64.514 43.1695 59.966 38.5645 54.269 38.5645Z" fill="#FEFEFE"></path>
            <path d="M28.014 38.507C24.871 38.507 22.288 41.09 22.288 44.233V53.46C22.288 56.603 24.871 59.186 28.014 59.186C31.157 59.186 33.74 56.603 33.74 53.46V44.233C33.74 41.09 31.157 38.507 28.014 38.507ZM28.014 56.402C26.442 56.402 25.172 55.132 25.172 53.56V44.13C25.172 42.558 26.442 41.288 28.014 41.288C29.586 41.288 30.856 42.558 30.856 44.13V53.56C30.856 55.132 29.586 56.402 28.014 56.402Z" fill="#FEFEFE"></path>
            <path d="M72.33 38.507H66.633V59.186H72.33C75.473 59.186 78.056 56.603 78.056 53.46V44.233C78.056 41.09 75.473 38.507 72.33 38.507ZM72.33 56.402H69.517V41.288H72.33C73.902 41.288 75.172 42.558 75.172 44.13V53.56C75.172 55.132 73.902 56.402 72.33 56.402Z" fill="#FEFEFE"></path>
        </g>
        <defs>
            <linearGradient id="paint0_linear_2_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8A00"></stop>
                <stop offset="1" stopColor="#E22000"></stop>
            </linearGradient>
            <clipPath id="clip0_2_2">
                <rect width="100" height="100" fill="white"></rect>
            </clipPath>
        </defs>
    </svg>
  );
}
