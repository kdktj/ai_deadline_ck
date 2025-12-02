import React from 'react';
import { cn } from '../../utils/cn';

const Card = ({ 
  children,
  title,
  subtitle,
  footer,
  className,
  bodyClassName,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'bg-white rounded-lg shadow border border-gray-200',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={cn('px-6 py-4', bodyClassName)}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
