import React from 'react';
import Badge from '../common/Badge';
import { getRiskColor, getRiskLabel } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const RiskBadge = ({ riskLevel, riskPercentage, className }) => {
  if (!riskLevel) return null;

  const colorClass = getRiskColor(riskLevel);
  const label = getRiskLabel(riskLevel);

  return (
    <Badge 
      className={cn(colorClass, className)}
      size="sm"
    >
      {label}
      {riskPercentage !== undefined && ` (${Math.round(riskPercentage)}%)`}
    </Badge>
  );
};

export default RiskBadge;
