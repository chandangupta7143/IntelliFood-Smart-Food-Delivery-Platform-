import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon = '🍽️',
  title = 'No items found',
  description = 'There are no items matching your criteria.',
  action = null, // { label: string, onClick: func, icon?: ReactNode }
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-xs max-w-md mx-auto my-8 ${className}`}>
      <div className="text-5xl mb-4 select-none">
        {typeof icon === 'string' ? icon : <span className="text-gray-400">{icon}</span>}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        {description}
      </p>
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
