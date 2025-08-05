
'use client';

import * as React from 'react';
import { ViñaIntegralLogo } from './viña-integral-logo';

export function DocumentHeader() {
  return (
    <header className="flex justify-between items-center pb-2 border-b-2 border-black">
      <div className="w-1/4 flex justify-start">
        <ViñaIntegralLogo className="h-16 w-16" />
      </div>
      <div className="w-1/2 text-center">
        <h1 className="text-2xl font-bold tracking-wider">Salud Integral</h1>
        <div className="text-[10px] leading-tight mt-1">
            <p className="font-bold">CENTRO POLICLINICO VALENCIA C.A</p>
            <p>Rif.: J075055861 Nit.: 0028937032</p>
            <p>URB. LA VIÑA, FINAL AV. CARABOBO</p>
            <p>Teléfonos.: 0241 8268688 8268431 8202710</p>
        </div>
      </div>
      <div className="w-1/4 flex justify-end">
         {/* Placeholder for the second logo */}
      </div>
    </header>
  );
}
