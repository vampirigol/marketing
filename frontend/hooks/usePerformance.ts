import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

const metricsStore = new Map<string, PerformanceMetrics>();

/**
 * Hook para medir performance de componentes
 * Útil para desarrollo y debugging
 */
export function useRenderMetrics(componentName: string, enabled: boolean = false) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef(0);

  if (enabled) {
    startTime.current = performance.now();
  }

  useEffect(() => {
    if (!enabled) return;
    // Calcular tiempo del render
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    renderCount.current += 1;
    renderTimes.current.push(renderTime);

    // Mantener solo los últimos 50 renders
    if (renderTimes.current.length > 50) {
      renderTimes.current.shift();
    }

    const averageRenderTime =
      renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

    const metrics: PerformanceMetrics = {
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime,
    };

    metricsStore.set(componentName, metrics);

    // Log cada 10 renders
    if (renderCount.current % 10 === 0) {
      console.log(`[Performance] ${componentName}:`, {
        renders: renderCount.current,
        lastRender: `${renderTime.toFixed(2)}ms`,
        avgRender: `${averageRenderTime.toFixed(2)}ms`,
      });
    }
  });

  return null;
}

/**
 * Obtener métricas de todos los componentes
 */
export function getPerformanceMetrics(): Map<string, PerformanceMetrics> {
  return metricsStore;
}

/**
 * Limpiar métricas
 */
export function clearPerformanceMetrics() {
  metricsStore.clear();
}

/**
 * Hook para detectar re-renders innecesarios
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function useWhyDidYouUpdate(name: string, props: Record<string, unknown>, enabled: boolean = false) {
  const previousProps = useRef<Record<string, unknown>>();

  useEffect(() => {
    if (!enabled) return;
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current && previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[Why Update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}
