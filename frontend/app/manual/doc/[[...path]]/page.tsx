'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MermaidDiagram } from '@/components/manual/MermaidDiagram';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const MANUAL_BRAND = {
  title: 'Manual CRM',
  subtitle: 'Red de Clínicas Adventistas',
  version: 'Versión 1.0',
  date: 'Febrero 2026',
  footer: 'Documento de uso interno · Manual CRM RCA',
};

function DocMembrete({ docTitle }: { docTitle?: string }) {
  return (
    <header className="membretado border-b-2 border-slate-300 pb-5 mb-6 bg-gradient-to-b from-slate-50/80 to-transparent -mx-8 px-8 pt-1 -mt-1 rounded-t-xl">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          <img
            src="/logo-clinicas.png"
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {MANUAL_BRAND.title}
          </h1>
          <p className="text-sm font-semibold text-blue-700 mt-0.5">
            {MANUAL_BRAND.subtitle}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0 mt-2 text-xs text-slate-500">
            <span>{MANUAL_BRAND.version}</span>
            <span aria-hidden>·</span>
            <span>{MANUAL_BRAND.date}</span>
            {docTitle && (
              <>
                <span aria-hidden>·</span>
                <span className="text-slate-600 font-medium">{docTitle}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function DocFooter() {
  return (
    <footer className="membretado border-t-2 border-slate-300 pt-4 mt-8 text-center text-xs text-slate-500 bg-gradient-to-t from-slate-50/60 to-transparent -mx-8 px-8 pb-6 rounded-b-xl">
      <p className="font-medium text-slate-600">{MANUAL_BRAND.footer}</p>
      <p className="mt-1">
        {MANUAL_BRAND.version} · {MANUAL_BRAND.date}
      </p>
    </footer>
  );
}

export default function ManualDocPage() {
  const params = useParams();
  const router = useRouter();
  const pathSegments = (params.path as string[] | undefined) ?? [];
  const [content, setContent] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mdPath = pathSegments.length ? `${pathSegments.join('/')}.md` : null;
  const docSlug = pathSegments[pathSegments.length - 1];

  useEffect(() => {
    if (!mdPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const url = `/manual/${mdPath}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Documento no encontrado');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        const firstLine = text.split('\n').find((l) => l.startsWith('# '));
        if (firstLine) setDocTitle(firstLine.replace(/^#\s*/, '').trim());
        else setDocTitle(docSlug?.replace(/-/g, ' ') ?? undefined);
      })
      .catch(() => setError('No se pudo cargar el documento.'))
      .finally(() => setLoading(false));
  }, [mdPath, docSlug]);

  if (!mdPath) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8">
          <Link
            href="/manual"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Manual
          </Link>
          <p className="text-slate-600">Selecciona un documento desde el índice del manual.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6 px-4 print:py-4 print:max-w-none">
        <Link
          href="/manual"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4 print:no-underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Manual
        </Link>

        <article className="manual-doc bg-white rounded-xl border border-slate-200 shadow-sm p-8 print:shadow-none print:border-0 print:p-0">
          <DocMembrete docTitle={docTitle} />

          {loading && (
            <div className="py-12 text-center text-slate-500">Cargando documento…</div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => router.push('/manual')}
                className="text-sm text-blue-600 hover:underline"
              >
                Volver al índice
              </button>
            </div>
          )}

          {!loading && !error && content && (
            <div className="prose prose-slate max-w-none manual-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-slate-800 mt-8 mb-4 first:mt-0 border-b border-slate-100 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="text-slate-600 leading-relaxed my-2">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 my-3 space-y-1 text-slate-600">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 my-3 space-y-1 text-slate-600">{children}</ol>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100 text-slate-700 font-medium">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="text-left px-4 py-2 border-b border-slate-200">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 border-b border-slate-100 text-slate-600">{children}</td>
                  ),
                  tr: ({ children }) => <tr className="border-b border-slate-100 last:border-0">{children}</tr>,
                  a: ({ href, children }) => {
                    const isExternal = href?.startsWith('http');
                    const isMd = href?.endsWith('.md');
                    let resolved = href;
                    if (isMd && href && !isExternal) {
                      const baseDir = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : '';
                      const withBase = href.startsWith('../') ? href : (baseDir ? `${baseDir}/` : '') + href;
                      const parts = withBase.split('/').filter(Boolean);
                      const out: string[] = [];
                      for (const p of parts) {
                        if (p === '..') out.pop();
                        else if (p !== '.') out.push(p.replace(/\.md$/, ''));
                      }
                      resolved = `/manual/doc/${out.join('/')}`;
                    }
                    return (
                      <a
                        href={resolved ?? '#'}
                        className="text-blue-600 hover:underline"
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                      >
                        {children}
                      </a>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-2 text-slate-600 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children }) =>
                    className?.includes('language-mermaid') ? (
                      <MermaidDiagram source={String(children ?? '').trim()} />
                    ) : className ? (
                      <code className={className}>{children}</code>
                    ) : (
                      <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ),
                  pre: ({ children }) => {
                    const child = React.Children.toArray(children)[0];
                    if (React.isValidElement(child) && (child.props as { className?: string })?.className?.includes('language-mermaid')) {
                      return (
                        <MermaidDiagram source={String((child.props as { children?: unknown }).children ?? '').trim()} />
                      );
                    }
                    return (
                      <pre className="bg-slate-100 rounded-lg p-4 overflow-x-auto text-sm my-3">
                        {children}
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {!loading && !error && content && <DocFooter />}
        </article>
      </div>

      <style jsx global>{`
        .manual-doc .manual-content pre {
          white-space: pre-wrap;
          word-break: break-word;
        }
        @media print {
          .manual-doc {
            box-shadow: none;
            border: none;
          }
          a[href^='/manual'] {
            color: #1e293b;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
