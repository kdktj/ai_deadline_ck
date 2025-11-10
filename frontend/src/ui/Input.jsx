import React from 'react';

export function Input({ label, type = 'text', placeholder = '', value, onChange, required = false }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-200 border-gray-200"
      />
    </label>
  );
}
