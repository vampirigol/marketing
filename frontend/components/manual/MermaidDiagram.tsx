'use client';

import { useEffect, useRef, useState } from 'react';

type MermaidDiagramProps = {
  source: string;
  id?: string;
  className?: string;
};

export function MermaidDiagram({ source, id, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source?.trim() || !containerRef.current) return;
    setError(null);
    const node = containerRef.current;
    node.textContent = source;
    node.classList.add('mermaid');
    import('mermaid')
      .then((m) => {
        const mermaid = m.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          flowchart: { useMaxWidth: true, htmlLabels: true },
        });
        return mermaid.run({
          nodes: [node],
          suppressErrors: false,
        });
      })
      .catch((err) => {
        setError(err?.message || 'Error al dibujar el diagrama.');
      });
  }, [source]);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <p className="font-medium">No se pudo mostrar el diagrama.</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id={id}
      className={`flex justify-center overflow-x-auto [&>svg]:max-w-full min-h-[120px] ${className ?? 'my-6'}`}
      aria-label="Diagrama de flujo"
    />
  );
}
