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

  useEffect(() => {
    const loadData = async () => {
      // First load settings
      const loadedSettings = await fetchSettings();
      // Then load chart data with the loaded settings
      await fetchChartData(loadedSettings);
    };
    loadData();
  }, [symbol, timeframe]);

  const fetchChartData = async (currentSettings: Settings | null = null) => {
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

      let chartData = result.data;

      // Use passed settings or state settings
      const settingsToUse = currentSettings || settings;

      // Filter data based on publish time if settings exist
      if (settingsToUse?.publishTime) {
        const publishDate = new Date(settingsToUse.publishTime);
        const startTime = new Date(publishDate);
        startTime.setDate(startTime.getDate() - 1); // 1 day before
        const endTime = new Date(publishDate);
        endTime.setDate(endTime.getDate() + 4); // 4 days after

        const startTimestamp = Math.floor(startTime.getTime() / 1000);
        const endTimestamp = Math.floor(endTime.getTime() / 1000);

        console.log('Filtering data based on publish time:', {
          publishTime: settingsToUse.publishTime,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          originalDataLength: chartData.length,
        });

        chartData = chartData.filter((candle: CandleData) =>
          candle.time >= startTimestamp && candle.time <= endTimestamp
        );

        console.log('Filtered data length:', chartData.length);
      }

      setData(chartData);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Chart Analysis</h1>
        <p className="text-gray-400">
          View candlestick charts with technical indicators
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <form onSubmit={handleSymbolChange} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trading Pair
              </label>
              <input
                type="text"
                name="symbol"
                defaultValue={symbol}
                placeholder="e.g., BTC/USDT"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition mt-auto"
            >
              Load
            </button>
          </form>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeframe
            </label>
            <div className="flex gap-2 flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
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
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-300">Indicators:</label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMA}
              onChange={(e) => setShowMA(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">MA(20)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEMA}
              onChange={(e) => setShowEMA(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">EMA(20)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBB}
              onChange={(e) => setShowBB(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Bollinger Bands</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRSI}
              onChange={(e) => setShowRSI(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">RSI(14)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMACD}
              onChange={(e) => setShowMACD(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">MACD</span>
          </label>
        </div>

        {settings && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300">
              <span className="font-semibold capitalize">{settings.zoneType}</span> zone at{' '}
              <span className="text-blue-400 font-bold">${settings.zonePrice}</span>
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        {loading && (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-white text-xl">Loading chart...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[500px]">
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
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <p className="text-gray-400">No data available</p>
              <p className="text-gray-500 text-sm mt-2">
                Enter a valid trading pair to view the chart
              </p>
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
