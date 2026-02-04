import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'promotion' | 'info' | 'secondary' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    default: 'bg-blue-600 text-white',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    promotion: 'badge-promotion',
    info: 'bg-info-light text-info-dark',
    secondary: 'bg-gray-100 text-gray-700',
    outline: 'bg-white border border-gray-300 text-gray-700',
  };

  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'Agendada' | 'Confirmada' | 'Llegó' | 'En_Atencion' | 'Finalizada' | 'Cancelada' | 'No_Asistio';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    Agendada: { label: 'Agendada', className: 'status-agendada' },
    Confirmada: { label: 'Confirmada', className: 'status-confirmada' },
    Llegó: { label: 'Llegó', className: 'status-confirmada' },
    En_Atencion: { label: 'En Atención', className: 'status-en-consulta' },
    Finalizada: { label: 'Atendida', className: 'status-atendida' },
    Cancelada: { label: 'Cancelada', className: 'status-cancelada' },
    No_Asistio: { label: 'No Asistió', className: 'status-no-asistio' },
  };

  const config = statusConfig[status];

  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
