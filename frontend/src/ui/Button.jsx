import React from 'react';

export function Button({ children, loading = false, className = '', variant, size, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium focus:outline-none';
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  };
  const sizes = {
    lg: 'px-4 py-3 text-sm',
    md: 'px-3 py-2 text-sm',
    sm: 'px-2 py-1 text-sm'
  };

  const cls = `${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`;

  return (
    <button className={cls} disabled={loading} {...props}>
      {loading ? <span className="opacity-80">Đang xử lý...</span> : children}
    </button>
  );
}
