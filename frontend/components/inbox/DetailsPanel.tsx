 'use client';
import React from 'react';
import { Calendar, DollarSign, FileText, User, Tag } from 'lucide-react';
import Image from 'next/image';

export default function DetailsPanel() {
  return (
    <aside className="w-[340px] bg-white rounded-xl m-4 shadow-md flex flex-col">
      {/* Perfil del contacto */}
      <div className="flex flex-col items-center p-6">
        <Image src="/client-avatar.png" alt="avatar" width={80} height={80} className="w-20 h-20 rounded-full mb-2" />
        <div className="font-bold text-lg">Juan Pérez</div>
        <div className="text-xs text-gray-500">+52 555 123 4567</div>
        <div className="text-xs text-blue-600">juanperez@email.com</div>
        <div className="flex space-x-2 mt-2">
          <a href="#" className="text-blue-600"><User /></a>
        </div>
      </div>
      {/* Accesos directos */}
      <div className="grid grid-cols-3 gap-2 px-6 mb-4">
        <button className="bg-gray-100 rounded-xl p-3 flex flex-col items-center text-xs">
          <Calendar className="w-5 h-5 mb-1 text-blue-600" />
          Cita
        </button>
        <button className="bg-gray-100 rounded-xl p-3 flex flex-col items-center text-xs">
          <DollarSign className="w-5 h-5 mb-1 text-green-600" />
          Cotización
        </button>
        <button className="bg-gray-100 rounded-xl p-3 flex flex-col items-center text-xs">
          <FileText className="w-5 h-5 mb-1 text-gray-600" />
          Expediente
        </button>
      </div>
      {/* Historial / Timeline */}
      <div className="px-6 mb-4">
        <div className="font-semibold text-sm mb-2">Historial</div>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>Cita completada hace 2 días</li>
          <li>Llamada perdida ayer</li>
        </ul>
      </div>
      {/* Etiquetas */}
      <div className="px-6 mb-4">
        <div className="font-semibold text-sm mb-2">Etiquetas</div>
        <div className="flex space-x-2">
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">Paciente VIP</span>
          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">Deudor</span>
          <button className="bg-gray-100 rounded-full px-2 text-xs"><Tag /></button>
        </div>
      </div>
    </aside>
  );
}
