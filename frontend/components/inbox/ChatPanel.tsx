 'use client';
import React from 'react';
import { MessageSquare, X, Share, Eye, Check, CheckCheck } from 'lucide-react';
import Composer from './Composer';

export default function ChatPanel() {
  return (
    <section className="flex-1 flex flex-col bg-white rounded-xl m-4 shadow-md">
      {/* Header */}
      <div className="flex items-center border-b p-4">
        <div className="font-bold text-lg mr-2">Juan Pérez</div>
        <span className="text-xs text-green-500">Escribiendo...</span>
        <button className="ml-auto bg-gray-100 rounded-full p-2 mx-1"><X className="w-4 h-4" /></button>
        <button className="bg-gray-100 rounded-full p-2 mx-1"><Share className="w-4 h-4" /></button>
        <button className="bg-gray-100 rounded-full p-2 mx-1"><Eye className="w-4 h-4" /></button>
      </div>
      {/* Stream de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Ejemplo de burbuja cliente */}
        <div className="max-w-[60%] bg-[#E4E6EB] rounded-xl p-3 text-black shadow-sm">
          Hola, ¿puedo agendar una cita?
          <div className="flex items-center mt-1 text-xs text-gray-400">
            <Check className="w-4 h-4" />
            <CheckCheck className="w-4 h-4 ml-1" />
          </div>
        </div>
        {/* Ejemplo de burbuja agente */}
        <div className="max-w-[60%] ml-auto bg-[#0084FF] rounded-xl p-3 text-white shadow-sm">
          Claro, ¿qué día prefieres?
          <div className="flex items-center mt-1 text-xs text-white">
            <CheckCheck className="w-4 h-4" />
            <CheckCheck className="w-4 h-4 ml-1 text-blue-300" />
          </div>
        </div>
        {/* Ejemplo de nota interna */}
        <div className="max-w-[40%] mx-auto bg-yellow-100 rounded-xl p-3 text-yellow-800 shadow-sm">
          Nota interna: Cliente solicita información de precios.
        </div>
      </div>
      <Composer />
    </section>
  );
}
