import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo component for IntelliFood
 *
 * @param {'sm' | 'md' | 'lg' | 'xl'} size - Dimension scale
 * @param {string} to - Optional Link destination
 * @param {boolean} showText - Whether to render side text along with icon or rely on the logo image
 * @param {string} className - Optional wrapper class
 * @param {string} subtitle - Optional badge/subtitle (e.g. "Delivery Partner", "Admin")
 */
export default function BrandLogo({
  size = 'md',
  to,
  showText = true,
  subtitle,
  className = '',
}) {
  const sizeMap = {
    sm: { img: 'w-8 h-8', text: 'text-lg', sub: 'text-[9px]' },
    md: { img: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group transition-transform ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl blur-xs opacity-40 group-hover:opacity-80 transition duration-300" />
        <img
          src="/brand-logo.png"
          alt="IntelliFood Logo"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/vite.svg';
          }}
          className={`${currentSize.img} rounded-xl object-cover relative z-10 shadow-sm transition-transform duration-300 group-hover:scale-105 border border-black/10`}
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-black tracking-tight text-gray-900 ${currentSize.text} flex items-center`}>
            <span>Intelli</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Food
            </span>
          </div>
          {subtitle ? (
            <span className={`font-bold tracking-wider uppercase text-emerald-600 ${currentSize.sub}`}>
              {subtitle}
            </span>
          ) : (
            <span className={`text-gray-400 font-medium tracking-wide ${currentSize.sub}`}>
              SMART DELIVERY
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
