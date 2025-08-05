
'use client';

import * as React from 'react';
import Image from 'next/image';

export function DocumentHeader() {
  return (
    <header className="flex justify-between items-center pb-2 border-b-2 border-black">
      <div className="w-1/4 flex justify-start">
        <Image src="/logo_salud_integral.svg" alt="Salud Integral La Viña" width={100} height={60} />
      </div>
      <div className="w-1/2 text-center">
        <h1 className="text-xl font-bold tracking-wider">SALUD INTEGRAL</h1>
        <p className="text-xs">CENTRO POLITÉCNICO VALENCIA, C.A.</p>
      </div>
      <div className="w-1/4 flex justify-end">
         <Image src="/logo_cpv.svg" alt="CPV Logo" width={50} height={50} />
      </div>
    </header>
  );
}
