import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request.',
  onRetry = null,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl bg-red-50 border border-red-200 text-center max-w-md mx-auto my-8 ${className}`}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-red-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-red-700 mb-5">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
