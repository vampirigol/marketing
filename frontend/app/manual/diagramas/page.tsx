'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { DIAGRAMAS } from '@/lib/manualDiagramas';
import { ArrowLeft, GitFork } from 'lucide-react';
import Link from 'next/link';

export default function ManualDiagramasPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Link
          href="/manual"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Manual CRM
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <GitFork className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diagramas de flujo</h1>
            <p className="text-sm text-gray-500">
              Elige un diagrama para verlo en pantalla completa. Para todos los equipos.
            </p>
          </div>
        </div>

        <Card className="mt-4">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Listado de diagramas</h2>
            <ul className="space-y-3">
              {DIAGRAMAS.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/manual/diagramas/${d.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold group-hover:bg-blue-200">
                      {d.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 block">{d.title}</span>
                      <span className="text-sm text-gray-500">{d.shortDescription}</span>
                    </div>
                    <span className="text-sm text-blue-600 group-hover:underline">Ver diagrama →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
