'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { BookOpen, FileText, Layers, Zap, GitBranch, BookMarked, GitFork } from 'lucide-react';
import Link from 'next/link';

const docsBase = '/manual/doc';

export default function ManualCrmPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-blue-600" />
            Manual CRM
          </h1>
          <p className="text-gray-500 mt-1">
            Documentación y guía de uso del sistema: pantallas, botones, automatizaciones y procesos.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cómo usar este manual</h2>
            <ul className="text-gray-600 space-y-1 text-sm mb-6">
              <li><strong>Si eres nuevo:</strong> empieza por Visión general.</li>
              <li><strong>Si buscas un módulo:</strong> ve a Módulos y abre el que necesites (Recepción, Citas, CRM, etc.).</li>
              <li><strong>Automatizaciones:</strong> schedulers y reglas automáticas.</li>
              <li><strong>Procesos de negocio:</strong> flujos de cita, lead e inasistencia de punta a punta.</li>
              <li><strong>Glosario:</strong> términos, estados y referencias.</li>
              <li><strong>Login, perfil, reservar, confirmar cita:</strong> ver Páginas y rutas adicionales.</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">Índice general</h2>
            <div className="grid gap-3">
              <Link
                href={`${docsBase}/01-VISION-GENERAL`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">01 – Visión general</span>
                  <p className="text-sm text-gray-500">Qué es el CRM, acceso, menú, roles</p>
                </div>
              </Link>
              <Link
                href={`${docsBase}/02-MODULOS/README`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <Layers className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">02 – Módulos</span>
                  <p className="text-sm text-gray-500">Manual de cada sección: Dashboard, Recepción, Citas, CRM, etc.</p>
                </div>
              </Link>
              <Link
                href={`${docsBase}/03-AUTOMATIZACIONES-Y-FLUJOS`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">03 – Automatizaciones y flujos</span>
                  <p className="text-sm text-gray-500">Schedulers, recordatorios, reglas de automatización</p>
                </div>
              </Link>
              <Link
                href={`${docsBase}/04-PROCESOS-DE-NEGOCIO`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <GitBranch className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">04 – Procesos de negocio</span>
                  <p className="text-sm text-gray-500">Ciclo de cita, lead, inasistencia, lista de espera</p>
                </div>
              </Link>
              <Link
                href={`${docsBase}/05-GLOSARIO-Y-REFERENCIA`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <BookMarked className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">05 – Glosario y referencia</span>
                  <p className="text-sm text-gray-500">Términos, estados de cita y lead, rutas</p>
                </div>
              </Link>
              <Link
                href={`${docsBase}/06-PAGINAS-Y-RUTAS-ADICIONALES`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">06 – Páginas y rutas adicionales</span>
                  <p className="text-sm text-gray-500">Login, perfil, automatizaciones, doctores, reservar, confirmar cita, contacto</p>
                </div>
              </Link>
              <Link
                href="/manual/diagramas"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-200 transition-colors"
              >
                <GitFork className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <span className="font-medium text-gray-900">07 – Diagramas de flujo</span>
                  <p className="text-sm text-gray-500">Submenú por diagrama: leads, conversión, recepción, citas (clic para ver uno)</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Módulos (acceso rápido)</h2>
            <p className="text-sm text-gray-500 mb-4">Documentación de cada pantalla del menú.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Recepción', file: 'recepcion' },
                { name: 'Dashboard', file: 'dashboard' },
                { name: 'CRM', file: 'crm' },
                { name: 'Doctores', file: 'doctores' },
                { name: 'Pacientes', file: 'pacientes' },
                { name: 'Expediente paciente', file: 'expediente-paciente' },
                { name: 'Citas', file: 'citas' },
                { name: 'Calendario', file: 'calendario' },
                { name: 'Keila IA', file: 'keila-matrix' },
                { name: 'Mensajero', file: 'mensajero' },
                { name: 'Brigadas', file: 'brigadas-medicas' },
                { name: 'Finanzas', file: 'finanzas' },
                { name: 'Reportes', file: 'reportes' },
                { name: 'Salud', file: 'salud' },
                { name: 'Auditoría', file: 'auditoria' },
                { name: 'Configuración', file: 'configuracion' },
              ].map(({ name, file }) => (
                <Link
                  key={file}
                  href={`${docsBase}/02-MODULOS/${file}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400">
          La documentación completa también está en la carpeta <code className="bg-gray-100 px-1 rounded">docs/manual/</code> del repositorio.
        </p>
      </div>
    </DashboardLayout>
  );
}
