import React from 'react';
import { cn } from '../../utils/cn';

const ProgressBar = ({ progress = 0, className, showLabel = true, size = 'md' }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const getColor = () => {
    if (clampedProgress < 30) return 'bg-red-500';
    if (clampedProgress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tiến độ</span>
          <span className="font-medium">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', getColor())}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
