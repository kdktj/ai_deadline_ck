import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/formatters';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend,
  trendValue,
  description,
  color = 'blue',
  loading = false,
  className
}) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      trend: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      trend: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      trend: 'text-yellow-600',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      trend: 'text-red-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      trend: 'text-purple-600',
    },
  };

  const colorScheme = colors[color] || colors.blue;

  if (loading) {
    return (
      <div className={cn('bg-white p-6 rounded-lg shadow border border-gray-200', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatNumber(value)}
          </p>
          
          {(trend || description) && (
            <div className="flex items-center gap-2 text-sm">
              {trend && (
                <div className={cn('flex items-center gap-1', colorScheme.trend)}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {trendValue && <span className="font-medium">{trendValue}</span>}
                </div>
              )}
              {description && (
                <span className="text-gray-500">{description}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn('p-3 rounded-lg', colorScheme.bg)}>
            <Icon className={cn('w-6 h-6', colorScheme.icon)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
