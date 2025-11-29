import React from 'react';
import { Calendar, ListTodo, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import ProgressBar from './ProgressBar';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const ProjectCard = ({ project, onClick, className }) => {
  if (!project) return null;

  // Calculate overall progress from tasks
  const calculateProgress = () => {
    if (!project.task_count || project.task_count === 0) return 0;
    return ((project.completed_tasks || 0) / project.task_count) * 100;
  };

  const progress = project.overall_progress ?? calculateProgress();

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={() => onClick && onClick(project)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <ProgressBar progress={progress} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ListTodo className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Tổng task</p>
              <p className="font-semibold text-gray-900">
                {project.task_count || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Hoàn thành</p>
              <p className="font-semibold text-gray-900">
                {project.completed_tasks || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-xs text-gray-600 border-t pt-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Bắt đầu: {formatDate(project.start_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Kết thúc: {formatDate(project.end_date)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
