
'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import { SaludIntegralLogo } from './logo-salud-integral';

export function PrescriptionDisplay({ consultation }: { consultation: Consultation }) {
  // NOTE: This component is designed to be printed on a vertical Letter-sized sheet (8.5in x 11in).
  // The layout is a diptych, meant to be folded in the middle.
  // Printing should be double-sided, flipping on the long edge.

  return (
    <div className="printable-area bg-white text-black font-sans">
      {/* Print-specific styles to ensure layout is respected */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-area {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
          }
          .print-page {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            page-break-after: always;
          }
          .print-page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>

      {/* PAGE 1: EXTERIOR (Cover and Back Cover) */}
      <div className="print-page w-[21.59cm] h-[27.94cm] flex flex-col m-auto">
        {/* TOP HALF: BACK COVER (Rotated 180 degrees) */}
        <div className="w-full h-1/2 flex-shrink-0" style={{ transform: 'rotate(180deg)' }}>
          <div className="w-full h-full p-[2cm] border">
            {/* Back cover content would go here, currently blank as requested */}
          </div>
        </div>
        
        {/* BOTTOM HALF: FRONT COVER */}
        <div className="w-full h-1/2 flex-shrink-0">
          <div className="w-full h-full p-[2cm] flex flex-col items-center justify-center border">
            <SaludIntegralLogo className="w-[5cm] h-auto" />
          </div>
        </div>
      </div>

      {/* PAGE 2: INTERIOR (Recipe and General Indications) */}
      <div className="print-page w-[21.59cm] h-[27.94cm] flex flex-col m-auto">
        {/* TOP HALF: GENERAL INDICATIONS */}
        <div className="w-full h-1/2 flex-shrink-0 relative">
          <div className="w-full h-full p-[2cm] border">
            <SaludIntegralLogo className="w-[3cm] h-auto absolute top-[2cm] right-[2cm]" />
             {/* General indications content would go here */}
          </div>
        </div>
        
        {/* BOTTOM HALF: MAIN RECIPE BODY */}
        <div className="w-full h-1/2 flex-shrink-0">
           <div className="w-full h-full p-[2cm] border">
             {/* Main recipe content (patient info, Rp, signature) would go here */}
           </div>
        </div>
      </div>

    </div>
  );
}
