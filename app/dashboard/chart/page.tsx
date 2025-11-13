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
      // Use passed settings or state settings
      const settingsToUse = currentSettings || settings;

      if (settingsToUse?.publishTime) {
        // Fetch data with publish time constraints
        await fetchChartDataWithPublishTime(settingsToUse);
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

  const fetchChartDataWithPublishTime = async (settingsToUse: Settings) => {
    const publishDate = new Date(settingsToUse.publishTime);
    const startTime = new Date(publishDate);
    startTime.setDate(startTime.getDate() - 1); // 1 day before
    const endTime = new Date(publishDate);
    endTime.setDate(endTime.getDate() + 4); // 4 days after

    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();

    // Calculate required data points based on timeframe
    const timeframeToMinutes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };

    const minutesPerCandle = timeframeToMinutes[timeframe] || 60;
    const totalMinutes = 5 * 24 * 60; // 5 days in minutes
    const requiredLimit = Math.ceil(totalMinutes / minutesPerCandle);

    // Binance API limit per request
    const maxPerRequest = 1000;

    console.log('Fetching data with publish time:', {
      publishTime: settingsToUse.publishTime,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timeframe,
      requiredLimit,
      maxPerRequest,
    });

    // If required data fits in one request, fetch directly
    if (requiredLimit <= maxPerRequest) {
      const apiUrl = `/api/klines?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${requiredLimit}&since=${startTimestamp}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chart data');
      }

      let chartData = result.data;
      chartData = chartData.filter((candle: CandleData) =>
        candle.time * 1000 >= startTimestamp && candle.time * 1000 <= endTimestamp
      );

      console.log('Single batch fetch completed:', {
        dataLength: chartData.length,
      });

      setData(chartData);
    } else {
      // Need multiple batches - fetch data in chunks
      const numBatches = Math.ceil(requiredLimit / maxPerRequest);
      let allData: CandleData[] = [];
      let currentSince = startTimestamp;

      console.log(`Fetching ${numBatches} batches of data...`);

      for (let i = 0; i < numBatches; i++) {
        // Check if we've reached the end time
        if (currentSince >= endTimestamp) {
          break;
        }

        const apiUrl = `/api/klines?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${maxPerRequest}&since=${currentSince}`;

        console.log(`Fetching batch ${i + 1}/${numBatches}...`);

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch chart data');
        }

        const batchData = result.data as CandleData[];

        if (batchData.length === 0) {
          // No more data available
          break;
        }

        // Add batch data to collection
        allData = allData.concat(batchData);

        // Update the 'since' timestamp for next batch
        // Use the last candle's time + 1 timeframe interval
        const lastCandle = batchData[batchData.length - 1];
        currentSince = (lastCandle.time * 1000) + (minutesPerCandle * 60 * 1000);

        // Check if we've passed the end time
        if (currentSince >= endTimestamp) {
          break;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Remove duplicates and filter to time range
      const uniqueData = Array.from(
        new Map(allData.map(item => [item.time, item])).values()
      );

      let chartData = uniqueData.filter((candle: CandleData) =>
        candle.time * 1000 >= startTimestamp && candle.time * 1000 <= endTimestamp
      );

      // Sort by time ascending
      chartData.sort((a, b) => a.time - b.time);

      console.log('Multi-batch fetch completed:', {
        totalBatches: numBatches,
        totalDataPoints: allData.length,
        afterDeduplication: uniqueData.length,
        afterFiltering: chartData.length,
        dataRange: {
          start: chartData[0] ? new Date(chartData[0].time * 1000).toISOString() : 'N/A',
          end: chartData[chartData.length - 1] ? new Date(chartData[chartData.length - 1].time * 1000).toISOString() : 'N/A',
        },
      });

      setData(chartData);
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
