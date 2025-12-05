import React from 'react';
import Badge from '../common/Badge';
import { getPriorityColor, getPriorityLabel } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const PriorityTag = ({ priority, className }) => {
  if (!priority) return null;

  const colorClass = getPriorityColor(priority);
  const label = getPriorityLabel(priority);

  return (
    <Badge 
      className={cn(colorClass, className)}
      size="sm"
    >
      {label}
    </Badge>
  );
};

export default PriorityTag;