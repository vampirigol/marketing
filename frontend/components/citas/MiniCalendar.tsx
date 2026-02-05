'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  highlightedDates?: Date[]; // Fechas con citas
}

export function MiniCalendar({ selectedDate, onDateSelect, highlightedDates = [] }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (!day) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasEvents = (day: number | null) => {
    if (!day) return false;
    return highlightedDates.some((d) => {
      return (
        d.getDate() === day &&
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(newDate);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((dia, idx) => (
          <div key={dia + idx} className="text-center text-xs font-medium text-gray-500">
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const today = isToday(day);
          const selected = isSelected(day);
          const events = hasEvents(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!day}
              className={`
                relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                ${!day ? 'invisible' : ''}
                ${today && !selected ? 'bg-blue-50 text-blue-600 font-bold ring-2 ring-blue-200' : ''}
                ${selected ? 'bg-blue-600 text-white font-bold shadow-md scale-110' : ''}
                ${!today && !selected ? 'hover:bg-gray-100 text-gray-700' : ''}
                ${!day ? '' : 'cursor-pointer'}
              `}
            >
              {day}
              {events && !selected && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-3 bg-blue-50 rounded border-2 border-blue-200" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-3 bg-blue-600 rounded" />
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-1 h-1 bg-blue-500 rounded-full" />
          <span className="ml-1">Con citas</span>
        </div>
      </div>
    </div>
  );
}
