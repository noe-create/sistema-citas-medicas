
'use client';

import * as React from 'react';

export function DocumentHeader() {
  return (
    <header className="flex justify-center items-center text-center pb-2 border-b-2 border-black">
      {/* Información Central */}
      <div className="flex flex-col items-center flex-grow px-2">
        <h1 className="text-xl font-bold tracking-wider">SALUD INTEGRAL</h1>
        <div className="text-xs mt-1 space-y-0.5">
          <p>CENTRO POLITÉCNICO VALENCIA, C.A.</p>
          <p>Rif: J075055861 Nit: 0028937032</p>
          <p>URB. LA VIÑA, FINAL AV. CARABOBO</p>
          <p>Teléfonos: 0241 8268688 / 8268431 / 8202710</p>
        </div>
      </div>
    </header>
  );
}
