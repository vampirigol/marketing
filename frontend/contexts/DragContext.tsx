'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Lead } from '@/types/matrix';

interface DragContextState {
  selectedLeads: Set<string>;
  toggleLeadSelection: (leadId: string, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  isLeadSelected: (leadId: string) => boolean;
  getSelectedLeadsArray: (allLeads: Lead[]) => Lead[];
}

const DragContext = createContext<DragContextState | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const toggleLeadSelection = useCallback((leadId: string, isMultiSelect: boolean) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      
      if (isMultiSelect) {
        // Multi-selección: agregar o quitar
        if (newSet.has(leadId)) {
          newSet.delete(leadId);
        } else {
          newSet.add(leadId);
        }
      } else {
        // Selección simple: reemplazar
        newSet.clear();
        newSet.add(leadId);
      }
      
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set());
  }, []);

  const isLeadSelected = useCallback(
    (leadId: string) => selectedLeads.has(leadId),
    [selectedLeads]
  );

  const getSelectedLeadsArray = useCallback(
    (allLeads: Lead[]) => {
      return allLeads.filter(lead => selectedLeads.has(lead.id));
    },
    [selectedLeads]
  );

  return (
    <DragContext.Provider
      value={{
        selectedLeads,
        toggleLeadSelection,
        clearSelection,
        isLeadSelected,
        getSelectedLeadsArray,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext debe usarse dentro de DragProvider');
  }
  return context;
}
