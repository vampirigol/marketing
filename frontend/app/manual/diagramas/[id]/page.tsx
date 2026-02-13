'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MermaidDiagram } from '@/components/manual/MermaidDiagram';
import { getDiagramaById } from '@/lib/manualDiagramas';
import { ArrowLeft, List, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ManualDiagramaDetallePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN;
  const diagrama = Number.isInteger(id) ? getDiagramaById(id) : undefined;
  const [expanded, setExpanded] = useState(false);

  if (!diagrama) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1920px] mx-auto py-6 px-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link
            href="/manual"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Manual CRM
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/manual/diagramas"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <List className="w-4 h-4" /> Ver listado de diagramas
          </Link>
        </div>

        <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <header className="border-b border-slate-200 pb-4 mb-4">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Diagrama {diagrama.id} de 7
            </p>
            <h1 className="text-xl font-bold text-slate-800 mt-1">{diagrama.title}</h1>
          </header>

          {/* Contenedor a tamaño pantalla (hasta 1920x1080) con clic para ampliar */}
          <div
            className="relative w-full bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition-shadow"
            onClick={() => setExpanded(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setExpanded(true)}
            aria-label="Clic para ver diagrama a tamaño completo"
            style={{ minHeight: '70vh', height: '70vh', maxWidth: '1920px' }}
          >
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs text-slate-500 bg-white/90 border border-slate-200 px-2 py-1 rounded shadow-sm">
              <Maximize2 className="w-3.5 h-3.5" /> Clic para ampliar a pantalla completa
            </div>
            <div className="w-full h-full flex items-center justify-center p-6">
              <MermaidDiagram
                source={diagrama.mermaid}
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
              />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1">En pocas palabras</p>
            <p className="text-sm text-slate-600 leading-relaxed">{diagrama.enPocasPalabras}</p>
          </div>

          <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap gap-4">
            <Link
              href="/manual/diagramas"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <List className="w-4 h-4" /> Ver todos los diagramas
            </Link>
            <Link
              href="/manual"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Manual CRM
            </Link>
          </footer>
        </article>
      </div>

      {/* Modal pantalla completa: clic fuera para cerrar */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Diagrama a pantalla completa. Clic fuera para cerrar."
        >
          <div
            className="bg-white overflow-auto flex flex-col items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100vw', height: '100vh', maxWidth: '1920px', maxHeight: '1080px' }}
          >
            <p className="text-sm text-slate-500 mb-4 self-start">Clic fuera del diagrama para cerrar</p>
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              <MermaidDiagram
                source={diagrama.mermaid}
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
