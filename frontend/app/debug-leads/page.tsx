'use client';

import { useEffect, useState } from 'react';
import { obtenerLeadsSimulados } from '@/lib/matrix.service';
import { Lead } from '@/types/matrix';

export default function DebugLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        console.log('Cargando leads...');
        const response = await obtenerLeadsSimulados({ 
          status: 'new',
          page: 1,
          limit: 50 
        });
        console.log('Respuesta:', response);
        setLeads(response.leads);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, []);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Debug: Leads Simulados</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <p className="text-lg font-semibold">Total de leads: {leads.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map(lead => (
          <div key={lead.id} className="border rounded-lg p-4 bg-white shadow hover:shadow-lg">
            <h3 className="font-bold text-lg mb-2">{lead.nombre}</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">ID:</span> {lead.id}</p>
              <p><span className="font-semibold">Status:</span> <span className="px-2 py-1 bg-blue-100 rounded">{lead.status}</span></p>
              <p><span className="font-semibold">Canal:</span> {lead.canal}</p>
              <p><span className="font-semibold">Email:</span> {lead.email}</p>
              <p><span className="font-semibold">Teléfono:</span> {lead.telefono}</p>
              <p><span className="font-semibold">Valor:</span> <span className="text-green-600 font-bold">${lead.valorEstimado}</span></p>
              <p><span className="font-semibold">Conversación:</span> {lead.conversacionId}</p>
              <div className="mt-2">
                <p className="font-semibold mb-1">Etiquetas:</p>
                <div className="flex flex-wrap gap-1">
                  {lead.etiquetas.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-200 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
