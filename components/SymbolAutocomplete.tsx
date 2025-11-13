'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SymbolAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'e.g., BTC, ETH',
  className = '',
}: SymbolAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (value.length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/symbols?q=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.symbols || []);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        console.error('API response not OK:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchSuggestions]);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(symbol);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = async () => {
    if (value.length >= 1) {
      // If we already have suggestions, just show them
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else if (!loading) {
        // Otherwise, fetch new suggestions
        await fetchSuggestions();
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((symbol, index) => (
            <button
              key={symbol}
              type="button"
              onClick={() => handleSelect(symbol)}
              className={`w-full px-4 py-2 text-left text-sm transition ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:bg-gray-600'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{symbol}</span>
                {symbol.endsWith('/USDT') && (
                  <span className="text-xs text-gray-400">USDT</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && value.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg px-4 py-3">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      )}
    </div>
  );
}
