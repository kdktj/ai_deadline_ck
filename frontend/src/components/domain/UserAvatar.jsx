import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';

const UserAvatar = ({ user, size = 'md', className }) => {
  if (!user) return null;

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const displayName = user.full_name || user.username || user.email;
  const initials = getInitials(displayName);
  const bgColor = getColorFromName(displayName);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-white font-medium',
          sizes[size],
          bgColor,
          className
        )}
      >
        {initials}
      </div>
      <span className="text-sm text-gray-700">{displayName}</span>
    </div>
  );
};

export default UserAvatar;
