'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { 
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function KPICard({ title, value, change, changeLabel, icon, color }: KPICardProps) {
  const isPositive = change >= 0;
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                {icon}
              </div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold flex items-center gap-1 ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(change)}%
                </span>
                <span className="text-xs text-gray-500">{changeLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MiniChartProps {
  data: number[];
  color?: string;
}

export function MiniChart({ data, color = 'blue' }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  return (
    <div className="h-16 flex items-end gap-1">
      {data.map((value, index) => {
        const height = range > 0 ? ((value - min) / range) * 100 : 50;
        return (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t rounded-t transition-all hover:opacity-80"
            style={{
              height: `${height}%`,
              backgroundImage: `linear-gradient(to top, var(--tw-gradient-stops))`,
              ['--tw-gradient-from' as string]: `rgb(${color === 'blue' ? '59 130 246' : color === 'green' ? '34 197 94' : '168 85 247'})`,
              ['--tw-gradient-to' as string]: `rgb(${color === 'blue' ? '96 165 250' : color === 'green' ? '74 222 128' : '192 132 252'})`,
            }}
          />
        );
      })}
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color?: string;
}

export function ProgressBar({ label, value, total, color = 'blue' }: ProgressBarProps) {
  const percentage = (value / total) * 100;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-900 font-bold">{value}/{total}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}

export function StatCard({ label, value, sublabel, color }: StatCardProps) {
  return (
    <Card className={`border-0 shadow-sm border-l-4 border-l-${color}-500`}>
      <CardContent className="p-5">
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sublabel && (
          <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
