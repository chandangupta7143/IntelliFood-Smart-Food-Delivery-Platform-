import React from 'react';
import { Loader2 } from 'lucide-react';

export function SkeletonBox({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-md w-3/4" />
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="h-4 bg-gray-200 rounded-md w-1/4" />
          <div className="h-4 bg-gray-200 rounded-md w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded-md w-1/3" />
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="h-4 bg-gray-200 rounded-md w-2/3" />
      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
        <div className="h-5 bg-gray-200 rounded-md w-20" />
        <div className="h-8 bg-gray-200 rounded-lg w-28" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex items-start gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="h-3 bg-gray-200 rounded-md w-3/4" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ text = 'Loading...' }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
      <p className="text-gray-500 text-sm font-medium">{text}</p>
    </div>
  );
}
