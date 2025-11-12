'use client';

import { useEffect, useState } from 'react';
import CandlestickChart from '@/components/CandlestickChart';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';
import Link from 'next/link';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Settings {
  zoneType: 'support' | 'resistance';
  zonePrice: number;
  publishTime: string;
}

export default function Home() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [symbolInput, setSymbolInput] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [data, setData] = useState<CandleData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMA, setShowMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  useEffect(() => {
    fetchChartData();
    fetchSettings();
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/klines?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=500`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chart data');
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const normalizedSymbol = symbol.replace('/', '');
      const response = await fetch(`/api/settings?symbol=${normalizedSymbol}`);

      if (response.ok) {
        const result = await response.json();
        setSettings(result);
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setSettings(null);
    }
  };

  const handleSymbolChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadSymbol(symbolInput);
  };

  const loadSymbol = (newSymbol: string) => {
    if (newSymbol) {
      newSymbol = newSymbol.trim().toUpperCase();

      // If symbol doesn't contain "/" and doesn't end with "USDT", add "/USDT"
      if (!newSymbol.includes('/') && !newSymbol.endsWith('USDT')) {
        newSymbol = newSymbol + '/USDT';
      }
      // If symbol doesn't contain "/" but ends with "USDT", add "/" before "USDT"
      else if (!newSymbol.includes('/') && newSymbol.endsWith('USDT')) {
        newSymbol = newSymbol.replace(/USDT$/, '/USDT');
      }

      setSymbol(newSymbol);
      setSymbolInput(newSymbol);
    }
  };

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  const getSupportResistance = () => {
    if (!settings) return {};

    return settings.zoneType === 'support'
      ? { supportLevel: settings.zonePrice }
      : { resistanceLevel: settings.zonePrice };
  };

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Crypto Review Tool</h1>

            {/* Symbol Input */}
            <form onSubmit={handleSymbolChange} className="flex gap-2">
              <SymbolAutocomplete
                value={symbolInput}
                onChange={setSymbolInput}
                onSelect={loadSymbol}
                placeholder="Search symbol..."
                className="w-40 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition"
              >
                Load
              </button>
            </form>

            {/* Timeframe Buttons */}
            <div className="flex gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-2 py-1 text-xs font-medium rounded transition ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side - Indicators and Auth */}
          <div className="flex items-center space-x-4">
            <div className="flex gap-3 text-sm">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMA}
                  onChange={(e) => setShowMA(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-gray-300">MA</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEMA}
                  onChange={(e) => setShowEMA(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-gray-300">EMA</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRSI}
                  onChange={(e) => setShowRSI(e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-gray-300">RSI</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Link
                href="/auth/signin"
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Info */}
        {settings && (
          <div className="px-4 py-1 bg-gray-750">
            <p className="text-xs text-gray-300">
              <span className="font-semibold capitalize text-blue-400">{settings.zoneType}</span> at{' '}
              <span className="text-white font-bold">${settings.zonePrice}</span>
            </p>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="p-2">
        {loading && (
          <div className="flex items-center justify-center h-[calc(100vh-100px)] bg-gray-800 rounded">
            <div className="text-white text-xl">Loading chart...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[calc(100vh-100px)] bg-gray-800 rounded">
            <div className="text-center">
              <p className="text-red-500 text-xl mb-2">Error loading chart</p>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="bg-gray-800 rounded">
            <CandlestickChart
              data={data}
              {...getSupportResistance()}
              showMA={showMA}
              showEMA={showEMA}
              showRSI={showRSI}
            />
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-[calc(100vh-100px)] bg-gray-800 rounded">
            <div className="text-center">
              <p className="text-gray-400 text-lg">Enter a trading pair to view the chart</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
