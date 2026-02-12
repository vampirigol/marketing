"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

// Importar SignatureCanvas dinámicamente (solo en cliente)
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as React.ComponentType<
  { canvasProps?: object; onBegin?: () => void; backgroundColor?: string; ref?: React.RefObject<{ clear: () => void; toDataURL: (s: string) => string; isEmpty: () => boolean }> }
>;

interface Props {
  onFirmar: (firmaDataURL: string) => void;
  onCancelar: () => void;
  titulo?: string;
}

export default function FirmaElectronicaModal({
  onFirmar,
  onCancelar,
  titulo = "Firmar Documento",
}: Props) {
  const sigCanvas = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const limpiar = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const guardar = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, firma antes de guardar");
      return;
    }
    
    const dataURL = sigCanvas.current?.toDataURL("image/png");
    onFirmar(dataURL);
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">{titulo}</h2>
            <p className="text-sm text-indigo-100">Firma con tu dedo o mouse</p>
          </div>
          <button
            onClick={onCancelar}
            className="rounded-full p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "signature-canvas w-full h-64 touch-none",
                style: { width: "100%", height: "256px" },
              }}
              onBegin={handleBegin}
              backgroundColor="rgb(248, 250, 252)"
            />
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              ✍️ <strong>Instrucciones:</strong> Firma dentro del recuadro. Tu firma será
              convertida en formato digital y adjuntada al documento.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={limpiar}
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            🗑️ Limpiar
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={isEmpty}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            ✓ Firmar Documento
          </button>
        </div>
      </div>
    </div>
  );
}
