
'use client';

import * as React from 'react';
import { ViñaIntegralLogo } from './viña-integral-logo';

export function DocumentHeader() {
  return (
    <header className="flex justify-between items-center text-center pb-2 border-b-2 border-black">
      {/* Logo Salud Integral a la izquierda */}
      <div className="w-32 h-auto flex-shrink-0">
         <img src="/logo_salud_integral.svg" alt="Logo Salud Integral" />
      </div>

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

      {/* Logo CPV a la derecha */}
       <div className="w-24 h-auto flex-shrink-0">
          <ViñaIntegralLogo className="w-24 h-auto"/>
       </div>
    </header>
  );
}
