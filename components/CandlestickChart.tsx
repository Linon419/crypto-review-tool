'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateRSI } from '@/lib/indicators';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartProps {
  data: CandleData[];
  supportLevel?: number;
  resistanceLevel?: number;
  showMA?: boolean;
  showEMA?: boolean;
  showRSI?: boolean;
}

export default function CandlestickChart({
  data,
  supportLevel,
  resistanceLevel,
  showMA = true,
  showEMA = true,
  showRSI = false,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Calculate chart height based on viewport
    const viewportHeight = window.innerHeight;
    const mainChartHeight = showRSI ? viewportHeight - 280 : viewportHeight - 130;

    // Create main chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: mainChartHeight,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;
    candlestickSeries.setData(data);

    // Add MA (20-period)
    if (showMA) {
      const ma20 = calculateSMA(data, 20);
      const maSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        title: 'MA(20)',
      });
      maSeries.setData(ma20);
    }

    // Add EMA (20-period)
    if (showEMA) {
      const ema20 = calculateEMA(data, 20);
      const emaSeries = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'EMA(20)',
      });
      emaSeries.setData(ema20);
    }

    // Add support level line
    if (supportLevel) {
      const supportLine = chart.addLineSeries({
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: 'Support',
      });

      const supportData = [
        { time: data[0].time, value: supportLevel },
        { time: data[data.length - 1].time, value: supportLevel },
      ];
      supportLine.setData(supportData);
    }

    // Add resistance level line
    if (resistanceLevel) {
      const resistanceLine = chart.addLineSeries({
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: 'Resistance',
      });

      const resistanceData = [
        { time: data[0].time, value: resistanceLevel },
        { time: data[data.length - 1].time, value: resistanceLevel },
      ];
      resistanceLine.setData(resistanceData);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Create RSI chart if enabled
    let rsiChart: IChartApi | null = null;
    if (showRSI && rsiContainerRef.current) {
      rsiChart = createChart(rsiContainerRef.current, {
        width: rsiContainerRef.current.clientWidth,
        height: 150,
        layout: {
          background: { color: '#1f2937' },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: { color: '#374151' },
          horzLines: { color: '#374151' },
        },
        rightPriceScale: {
          borderColor: '#4b5563',
        },
        timeScale: {
          borderColor: '#4b5563',
          timeVisible: true,
          secondsVisible: false,
          visible: false,
        },
      });

      rsiChartRef.current = rsiChart;

      const rsiData = calculateRSI(data, 14);
      const rsiSeries = rsiChart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        title: 'RSI(14)',
      });
      rsiSeries.setData(rsiData);

      // Add RSI level lines (30 and 70)
      const oversoldLine = rsiChart.addLineSeries({
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 2,
      });
      oversoldLine.setData([
        { time: data[0].time, value: 30 },
        { time: data[data.length - 1].time, value: 30 },
      ]);

      const overboughtLine = rsiChart.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
      });
      overboughtLine.setData([
        { time: data[0].time, value: 70 },
        { time: data[data.length - 1].time, value: 70 },
      ]);

      // Sync time scales
      chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && rsiChart) {
          rsiChart.timeScale().setVisibleRange(timeRange);
        }
      });

      rsiChart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange) {
          chart.timeScale().setVisibleRange(timeRange);
        }
      });
    }

    // Handle resize
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      const newMainChartHeight = showRSI ? viewportHeight - 280 : viewportHeight - 130;

      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newMainChartHeight,
        });
      }
      if (showRSI && rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          // Chart already disposed, ignore error
        }
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        try {
          rsiChartRef.current.remove();
        } catch (error) {
          // Chart already disposed, ignore error
        }
        rsiChartRef.current = null;
      }
    };
  }, [data, supportLevel, resistanceLevel, showMA, showEMA, showRSI]);

  return (
    <div className="space-y-2">
      <div
        ref={chartContainerRef}
        className="w-full bg-gray-800 rounded-lg border border-gray-700"
      />
      {showRSI && (
        <div
          ref={rsiContainerRef}
          className="w-full bg-gray-800 rounded-lg border border-gray-700"
        />
      )}
    </div>
  );
}
