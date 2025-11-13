'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CandlestickChart from '@/components/CandlestickChart';

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

interface WatchlistItem {
  id: string;
  symbol: string;
}

function ChartContent() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || 'BTC/USDT';

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1h');
  const [data, setData] = useState<CandleData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMA, setShowMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // First load settings
      const loadedSettings = await fetchSettings();
      // Then load chart data with the loaded settings
      await fetchChartData(loadedSettings);
    };
    loadData();
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchChartData = async (currentSettings: Settings | null = null) => {
    setLoading(true);
    setError('');

    try {
      // Use passed settings or state settings
      const settingsToUse = currentSettings || settings;

      if (settingsToUse?.publishTime) {
        // Use cached API for symbols with publish time
        const apiUrl = `/api/klines-cached?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`;
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chart data');
        }

        console.log(result.cached ? '✓ Loaded from cache' : '⟳ Fetched from Binance and cached');
        setData(result.data);
      } else {
        // Fetch latest data without time constraints
        const apiUrl = `/api/klines?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=500`;
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chart data');
        }

        setData(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async (): Promise<Settings | null> => {
    try {
      // Convert symbol format (BTC/USDT -> BTCUSDT)
      const normalizedSymbol = symbol.replace('/', '');
      const response = await fetch(`/api/settings?symbol=${normalizedSymbol}`);

      if (response.ok) {
        const result = await response.json();
        setSettings(result);
        return result;
      } else {
        setSettings(null);
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setSettings(null);
      return null;
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    }
  };

  const handleSymbolChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSymbol = formData.get('symbol') as string;
    if (newSymbol) {
      setSymbol(newSymbol.toUpperCase());
    }
  };

  const timeframes = [
    { value: '1m', label: '1 Min' },
    { value: '5m', label: '5 Min' },
    { value: '15m', label: '15 Min' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hour' },
    { value: '1d', label: '1 Day' },
  ];

  const getSupportResistance = () => {
    if (!settings) return {};

    const zoneProps = settings.zoneType === 'support'
      ? { supportLevel: settings.zonePrice }
      : { resistanceLevel: settings.zonePrice };

    return {
      ...zoneProps,
      publishTime: settings.publishTime,
    };
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chart Analysis</h1>
            <p className="text-gray-400 text-sm">
              {symbol} - {timeframes.find(tf => tf.value === timeframe)?.label}
            </p>
          </div>
          <button
            onClick={() => setShowWatchlist(!showWatchlist)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
          >
            {showWatchlist ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Hide Watchlist
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                Show Watchlist
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Controls */}
          <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
            {/* Timeframe Selector */}
            <div className="flex gap-2 mb-3">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    timeframe === tf.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Indicators */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-medium text-gray-400">Indicators:</span>
              {[
                { key: 'MA', label: 'MA(20)', checked: showMA, onChange: setShowMA },
                { key: 'EMA', label: 'EMA(20)', checked: showEMA, onChange: setShowEMA },
                { key: 'BB', label: 'BB', checked: showBB, onChange: setShowBB },
                { key: 'RSI', label: 'RSI', checked: showRSI, onChange: setShowRSI },
                { key: 'MACD', label: 'MACD', checked: showMACD, onChange: setShowMACD },
              ].map(ind => (
                <label key={ind.key} className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ind.checked}
                    onChange={(e) => ind.onChange(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-300">{ind.label}</span>
                </label>
              ))}
            </div>

            {settings && (
              <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-300">
                <span className="font-semibold capitalize">{settings.zoneType}</span> zone:
                <span className="text-blue-400 font-bold ml-1">${settings.zonePrice}</span>
              </div>
            )}
          </div>

          {/* Chart Display */}
          <div className="flex-1 overflow-hidden bg-gray-900 p-4">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-white text-xl">Loading chart...</div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-500 text-xl mb-2">Error loading chart</p>
                  <p className="text-gray-400">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && data.length > 0 && (
              <CandlestickChart
                data={data}
                {...getSupportResistance()}
                showMA={showMA}
                showEMA={showEMA}
                showRSI={showRSI}
                showMACD={showMACD}
                showBB={showBB}
              />
            )}

            {!loading && !error && data.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400">No data available</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Select a symbol from watchlist
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Watchlist Panel */}
        {showWatchlist && (
          <div className="w-80 flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {watchlist.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No symbols in watchlist
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {watchlist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSymbol(item.symbol)}
                      className={`w-full p-4 text-left hover:bg-gray-700 transition ${
                        symbol === item.symbol ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="font-medium text-white">{item.symbol}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <ChartContent />
    </Suspense>
  );
}
