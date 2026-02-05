'use client';

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export type ZoomLevel = 'compact' | 'normal' | 'extended';

interface ZoomControlsProps {
  zoomLevel: ZoomLevel;
  onChange: (level: ZoomLevel) => void;
}

export function ZoomControls({ zoomLevel, onChange }: ZoomControlsProps) {
  const levels: { value: ZoomLevel; label: string; height: string; description: string }[] = [
    { value: 'compact', label: 'Compacto', height: '40px', description: '30 min por slot' },
    { value: 'normal', label: 'Normal', height: '60px', description: '1 hora por slot' },
    { value: 'extended', label: 'Extendido', height: '120px', description: '30 min por slot' }
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-gray-700 font-medium text-sm">
          <Maximize2 className="w-4 h-4" />
          <span>Zoom:</span>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {levels.map((level) => {
            const isActive = zoomLevel === level.value;
            return (
              <button
                key={level.value}
                onClick={() => onChange(level.value)}
                className={`
                  relative px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
                title={level.description}
              >
                <div className="flex items-center gap-1.5">
                  {level.value === 'compact' && <ZoomOut className="w-3.5 h-3.5" />}
                  {level.value === 'normal' && <Maximize2 className="w-3.5 h-3.5" />}
                  {level.value === 'extended' && <ZoomIn className="w-3.5 h-3.5" />}
                  <span>{level.label}</span>
                </div>
                
                {/* Indicador visual de altura */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
                  <div className={`w-1 bg-gray-300 rounded-t ${isActive ? 'bg-blue-500' : ''}`} style={{ height: level.value === 'compact' ? '4px' : level.value === 'normal' ? '8px' : '12px' }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Info del nivel actual */}
        <div className="ml-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            {levels.find(l => l.value === zoomLevel)?.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function getZoomConfig(zoomLevel: ZoomLevel) {
  const configs = {
    compact: {
      slotHeight: 40,
      slotMinutes: 30,
      fontSize: 'text-xs',
      padding: 'p-1.5',
      showMinutes: false
    },
    normal: {
      slotHeight: 60,
      slotMinutes: 60,
      fontSize: 'text-sm',
      padding: 'p-2',
      showMinutes: true
    },
    extended: {
      slotHeight: 120,
      slotMinutes: 30,
      fontSize: 'text-base',
      padding: 'p-3',
      showMinutes: true
    }
  };

  return configs[zoomLevel];
}
