import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'up' | 'down' | 'slow' | 'pending' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  up: {
    label: 'Up',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  },
  down: {
    label: 'Down',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  },
  slow: {
    label: 'Slow',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  },
  error: {
    label: 'Error',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  },
} as const;

const sizeConfig = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-2.5 py-1.5',
} as const;

export default function StatusBadge({ 
  status, 
  size = 'md', 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border transition-colors',
        config.className,
        sizeClasses,
        className
      )}
    >
      <div className="flex items-center gap-1">
        <div
          className={cn(
            'rounded-full',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5',
            status === 'up' && 'bg-green-500',
            status === 'down' && 'bg-red-500',
            status === 'slow' && 'bg-yellow-500',
            status === 'pending' && 'bg-blue-500',
            status === 'error' && 'bg-orange-500'
          )}
        />
        {config.label}
      </div>
    </Badge>
  );
}