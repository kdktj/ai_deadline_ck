import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return '-';
  }
};

/**
 * Format datetime to readable string
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return '-';
  }
};

/**
 * Format number with thousand separator
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Format progress percentage
 */
export const formatProgress = (progress) => {
  if (progress === null || progress === undefined) return '0%';
  return `${Math.round(progress)}%`;
};

/**
 * Get risk level color
 */
export const getRiskColor = (riskLevel) => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[riskLevel] || colors.low;
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
  const colors = {
    todo: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    done: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || colors.todo;
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[priority] || colors.low;
};

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (status) => {
  const labels = {
    todo: 'Chưa bắt đầu',
    in_progress: 'Đang thực hiện',
    done: 'Hoàn thành',
    blocked: 'Bị chặn',
  };
  return labels[status] || status;
};

/**
 * Get priority label in Vietnamese
 */
export const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Khẩn cấp',
  };
  return labels[priority] || priority;
};

/**
 * Get risk level label in Vietnamese
 */
export const getRiskLabel = (riskLevel) => {
  const labels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Rất cao',
  };
  return labels[riskLevel] || riskLevel;
};
