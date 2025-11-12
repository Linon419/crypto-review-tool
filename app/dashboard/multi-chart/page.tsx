'use client';

import { useEffect, useState } from 'react';
import CandlestickChart from '@/components/CandlestickChart';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartConfig {
  id: string;
  symbol: string;
  timeframe: string;
  data: CandleData[];
  loading: boolean;
  error: string;
  showMA: boolean;
  showEMA: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showBB: boolean;
}

type LayoutType = '1x1' | '2x1' | '1x2' | '2x2' | '3x2';

const LAYOUT_CONFIGS = {
  '1x1': { rows: 1, cols: 1, count: 1 },
  '2x1': { rows: 1, cols: 2, count: 2 },
  '1x2': { rows: 2, cols: 1, count: 2 },
  '2x2': { rows: 2, cols: 2, count: 4 },
  '3x2': { rows: 2, cols: 3, count: 6 },
};

export default function MultiChartPage() {
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [charts, setCharts] = useState<ChartConfig[]>([]);

  useEffect(() => {
    // Initialize charts based on layout
    const layoutConfig = LAYOUT_CONFIGS[layout];
    const newCharts: ChartConfig[] = [];

    for (let i = 0; i < layoutConfig.count; i++) {
      newCharts.push({
        id: `chart-${i}`,
        symbol: i === 0 ? 'BTC/USDT' : '',
        timeframe: '1h',
        data: [],
        loading: false,
        error: '',
        showMA: true,
        showEMA: true,
        showRSI: false,
        showMACD: false,
        showBB: false,
      });
    }

    setCharts(newCharts);
  }, [layout]);

  const fetchChartData = async (chartId: string, symbol: string, timeframe: string) => {
    if (!symbol) return;

    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId
          ? { ...chart, loading: true, error: '' }
          : chart
      )
    );

    try {
      const response = await fetch(
        `/api/klines?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=500`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch chart data');
      }

      setCharts((prev) =>
        prev.map((chart) =>
          chart.id === chartId
            ? { ...chart, data: result.data, loading: false }
            : chart
        )
      );
    } catch (err: any) {
      setCharts((prev) =>
        prev.map((chart) =>
          chart.id === chartId
            ? { ...chart, error: err.message || 'Failed to load chart data', data: [], loading: false }
            : chart
        )
      );
    }
  };

  const updateChartSymbol = (chartId: string, symbol: string) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, symbol } : chart
      )
    );
  };

  const handleChartSymbolSelect = (chartId: string, symbol: string) => {
    const chart = charts.find((c) => c.id === chartId);
    if (chart) {
      updateChartSymbol(chartId, symbol);
      fetchChartData(chartId, symbol, chart.timeframe);
    }
  };

  const updateChartTimeframe = (chartId: string, timeframe: string) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, timeframe } : chart
      )
    );

    const chart = charts.find((c) => c.id === chartId);
    if (chart && chart.symbol) {
      fetchChartData(chartId, chart.symbol, timeframe);
    }
  };

  const toggleIndicator = (chartId: string, indicator: keyof Pick<ChartConfig, 'showMA' | 'showEMA' | 'showRSI' | 'showMACD' | 'showBB'>) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId
          ? { ...chart, [indicator]: !chart[indicator] }
          : chart
      )
    );
  };

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  const layoutConfig = LAYOUT_CONFIGS[layout];

  // Map layout to Tailwind CSS classes
  const gridClasses: Record<LayoutType, string> = {
    '1x1': 'grid grid-cols-1 gap-4',
    '2x1': 'grid grid-cols-2 gap-4',
    '1x2': 'grid grid-cols-1 gap-4',
    '2x2': 'grid grid-cols-2 gap-4',
    '3x2': 'grid grid-cols-3 gap-4',
  };

  const gridClass = gridClasses[layout];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Multi-Chart Layout</h1>
        <p className="text-gray-400">View multiple charts simultaneously</p>
      </div>

      {/* Layout selector */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select Layout:
        </label>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(LAYOUT_CONFIGS) as LayoutType[]).map((layoutType) => (
            <button
              key={layoutType}
              onClick={() => setLayout(layoutType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                layout === layoutType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {layoutType}
            </button>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className={gridClass}>
        {charts.map((chart) => (
          <div
            key={chart.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            {/* Chart controls */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-2">
                <SymbolAutocomplete
                  value={chart.symbol}
                  onChange={(value) => updateChartSymbol(chart.id, value)}
                  onSelect={(symbol) => handleChartSymbolSelect(chart.id, symbol)}
                  placeholder="e.g., BTC/USDT"
                  className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-1 flex-wrap">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => updateChartTimeframe(chart.id, tf.value)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      chart.timeframe === tf.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap text-xs">
                {[
                  { key: 'showMA' as const, label: 'MA' },
                  { key: 'showEMA' as const, label: 'EMA' },
                  { key: 'showBB' as const, label: 'BB' },
                  { key: 'showRSI' as const, label: 'RSI' },
                  { key: 'showMACD' as const, label: 'MACD' },
                ].map((ind) => (
                  <label key={ind.key} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chart[ind.key]}
                      onChange={() => toggleIndicator(chart.id, ind.key)}
                      className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{ind.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Chart display */}
            <div className="h-[400px] overflow-hidden">
              {chart.loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-sm">Loading...</div>
                </div>
              )}

              {chart.error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-500 text-sm">Error</p>
                    <p className="text-gray-400 text-xs">{chart.error}</p>
                  </div>
                </div>
              )}

              {!chart.loading && !chart.error && chart.data.length > 0 && (
                <CandlestickChart
                  data={chart.data}
                  showMA={chart.showMA}
                  showEMA={chart.showEMA}
                  showRSI={chart.showRSI}
                  showMACD={chart.showMACD}
                  showBB={chart.showBB}
                />
              )}

              {!chart.loading && !chart.error && chart.data.length === 0 && !chart.symbol && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Enter a symbol to view chart</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
