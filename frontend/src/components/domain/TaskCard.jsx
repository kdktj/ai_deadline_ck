import React from 'react';
import { Calendar, User } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from './ProgressBar';
import PriorityTag from './PriorityTag';
import RiskBadge from './RiskBadge';
import { getStatusColor, getStatusLabel, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const TaskCard = ({ task, onClick, showProject = false, className }) => {
  if (!task) return null;

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={() => onClick && onClick(task)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 flex-1 line-clamp-2">
            {task.name}
          </h4>
          <PriorityTag priority={task.priority} />
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Progress */}
        <ProgressBar progress={task.progress} size="sm" />

        {/* Footer Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          {task.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(task.deadline)}</span>
            </div>
          )}
          
          {task.assigned_to_name && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{task.assigned_to_name}</span>
            </div>
          )}
        </div>

        {/* Status and Risk */}
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(task.status)}>
            {getStatusLabel(task.status)}
          </Badge>
          
          {task.risk_level && (
            <RiskBadge 
              riskLevel={task.risk_level} 
              riskPercentage={task.risk_percentage}
            />
          )}
        </div>

        {/* Project name (if showProject) */}
        {showProject && task.project_name && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Dự án: {task.project_name}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
