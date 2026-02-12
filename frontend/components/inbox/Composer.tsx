 'use client';
import React from 'react';
import { Paperclip, Smile, Mic, Zap } from 'lucide-react';

export default function Composer() {
  return (
    <div className="flex items-center border-t p-4 bg-white">
      <input
        className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none text-sm"
        placeholder="Escribe un mensaje..."
      />
      <button className="ml-2 bg-gray-100 rounded-full p-2"><Paperclip /></button>
      <button className="ml-2 bg-gray-100 rounded-full p-2"><Smile /></button>
      <button className="ml-2 bg-gray-100 rounded-full p-2"><Mic /></button>
      <button className="ml-2 bg-[#0084FF] text-white rounded-full p-2"><Zap /></button>
    </div>
  );
}
