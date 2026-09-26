import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  defaultValue = '',
  onSearch,
  placeholder = 'Search dishes, restaurants or cuisines...',
  variant = 'page',
  className = '',
}) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSearch?.(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  if (variant === 'navbar') {
    return (
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full max-w-xs sm:max-w-sm md:max-w-md ${className}`}
      >
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-gray-100 hover:bg-gray-150 focus:bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 rounded-full border border-transparent focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
    );
  }

  // Page / Hero variant
  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5 transition-shadow hover:shadow-xl focus-within:ring-2 focus-within:ring-orange-400 ${className}`}
    >
      <div className="pl-4 pr-2 text-gray-400">
        <Search className="w-5 h-5 text-orange-500" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 text-sm md:text-base text-gray-800 placeholder-gray-400 bg-transparent border-none focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 mr-2 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
      >
        Search
      </button>
    </form>
  );
}
