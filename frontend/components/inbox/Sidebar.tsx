 'use client';
import React from 'react';
import { Pencil, Search, MessageSquare, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';

const filters = [
  { label: 'Todos' },
  { label: 'No leídos' },
  { label: 'Míos' },
  { label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4 text-green-500" /> },
  { label: 'Messenger', icon: <Facebook className="w-4 h-4 text-blue-600" /> },
  { label: 'Instagram', icon: <Instagram className="w-4 h-4 text-pink-500" /> },
];

export default function Sidebar() {
  return (
    <aside className="w-[340px] bg-[#F0F2F5] flex flex-col border-r border-gray-200 h-full">
      {/* Cabecera */}
      <div className="flex items-center p-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2">
          {/* Avatar usuario actual */}
          <Image src="/avatar.png" alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
        </div>
        <span className="text-xs text-green-500 font-semibold">Online</span>
        <button className="ml-auto bg-[#0084FF] text-white rounded-full p-2 shadow-md">
          <Pencil />
        </button>
      </div>
      {/* Barra de herramientas */}
      <div className="px-4 mb-2">
        <div className="flex items-center bg-white rounded-xl shadow-sm p-2">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Buscar..." />
        </div>
        <div className="flex space-x-2 mt-2">
          {filters.map(f => (
            <button key={f.label} className="px-3 py-1 bg-white rounded-full text-xs shadow-sm border border-gray-200 flex items-center">
              {f.icon && <span className="mr-1">{f.icon}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Aquí se mapearán ConversationCard */}
        {/* Ejemplo */}
        <div className="bg-white rounded-xl p-3 mb-2 flex items-center shadow-sm relative">
          <Image src="/client-avatar.png" alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full mr-2" />
          <span className="absolute top-0 left-6 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
            <MessageSquare className="w-3 h-3" />
          </span>
          <div className="flex-1">
            <div className="font-bold text-sm">Juan Pérez</div>
            <div className="text-xs text-gray-500 truncate">🎤 Nota de voz (0:15)...</div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400">14:05</span>
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 mt-1">2</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
