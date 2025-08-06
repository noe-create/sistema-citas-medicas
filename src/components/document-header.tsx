
'use client';

import * as React from 'react';

export function DocumentHeader() {
  return (
    <header className="flex justify-between items-center text-center pb-2 border-b-2 border-black">
      {/* Logo Salud Integral SVG */}
      <div className="w-24 h-auto">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 150 75"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
          <circle cx="20" cy="55" r="3" fill="currentColor" />
          <circle cx="53" cy="18" r="3" fill="currentColor" />

          <text x="65" y="28" fontFamily="sans-serif" fontSize="12" fill="currentColor">
            Salud Integral
          </text>
          <text x="80" y="42" fontFamily="sans-serif" fontSize="12" fill="currentColor">
            la Viña
          </text>

          <text x="30" y="68" fontFamily="sans-serif" fontSize="6" fill="currentColor">
            Centro Policlínico Valencia, C.A.
          </text>

          {/* Family Icon Placeholder */}
          <path d="M75 50 L 78 45 L 81 50 Z M 80 50 L 80 55" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M85 50 L 88 45 L 91 50 Z M 90 50 L 90 55" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M95 52 L 97 48 L 99 52 Z M 98 52 L 98 55" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <path d="M102 52 L 104 48 L 106 52 Z M 105 52 L 105 55" stroke="currentColor" strokeWidth="0.8" fill="none" />

          <g transform="translate(15, 28)">
            <circle cx="15" cy="15" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <text x="12" y="19" fontFamily="serif" fontSize="12" fontWeight="bold" fill="currentColor">
              &amp;
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center flex-grow px-4">
        <h1 className="text-xl font-bold tracking-wider">SALUD INTEGRAL</h1>
        <div className="text-xs mt-1 space-y-0.5">
          <p>CENTRO POLITÉCNICO VALENCIA, C.A.</p>
          <p>Rif: J075055861 Nit: 0028937032</p>
          <p>URB. LA VIÑA, FINAL AV. CARABOBO</p>
          <p>Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
        </div>
      </div>

      {/* Logo CPV SVG */}
       <div className="w-24 h-auto">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-gradient-cpv" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2A64F5" />
                <stop offset="1" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM50 88C70.9868 88 88 70.9868 88 50C88 29.0132 70.9868 12 50 12C29.0132 12 12 29.0132 12 50C12 70.9868 29.0132 88 50 88Z"
              fill="url(#logo-gradient-cpv)"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M50 78C62.6929 78 73 67.6929 73 55C73 45.8197 67.4695 37.9377 59.4316 35.3053C58.8227 35.0888 58.1724 35 57.5 35H42.5C41.8276 35 41.1773 35.0888 40.5684 35.3053C32.5305 37.9377 27 45.8197 27 55C27 67.6929 37.3071 78 50 78ZM50 67C56.6274 67 62 61.6274 62 55C62 48.3726 56.6274 43 50 43C43.3726 43 38 48.3726 38 55C38 61.6274 43.3726 67 50 67Z"
              fill="url(#logo-gradient-cpv)"
            />
          </svg>
       </div>
    </header>
  );
}
