'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '@/lib/indicators';

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
  showMACD?: boolean;
  showBB?: boolean;
  publishTime?: string;
}

export default function CandlestickChart({
  data,
  supportLevel,
  resistanceLevel,
  showMA = true,
  showEMA = true,
  showRSI = false,
  showMACD = false,
  showBB = false,
  publishTime,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Calculate chart height based on viewport and active indicators
    const viewportHeight = window.innerHeight;
    let heightOffset = 130; // Base offset
    if (showRSI) heightOffset += 150;
    if (showMACD) heightOffset += 150;
    const mainChartHeight = viewportHeight - heightOffset;

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

    // Add Publish Time marker
    if (publishTime) {
      try {
        const publishTimestamp = Math.floor(new Date(publishTime).getTime() / 1000);
        const publishDate = new Date(publishTime);
        const formattedTime = publishDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        candlestickSeries.setMarkers([
          {
            time: publishTimestamp,
            position: 'belowBar',
            color: '#3b82f6',
            shape: 'arrowUp',
            text: `Publish: ${formattedTime}`,
          },
        ]);
      } catch (error) {
        console.error('Failed to add publish time marker:', error);
      }
    }

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

    // Add Bollinger Bands
    if (showBB) {
      const bbData = calculateBollingerBands(data, 20, 2);

      // Upper band
      const upperBand = chart.addLineSeries({
        color: '#a855f7',
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperBand.setData(bbData.map(d => ({ time: d.time, value: d.upper })));

      // Middle band
      const middleBand = chart.addLineSeries({
        color: '#ec4899',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Middle',
      });
      middleBand.setData(bbData.map(d => ({ time: d.time, value: d.middle })));

      // Lower band
      const lowerBand = chart.addLineSeries({
        color: '#a855f7',
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerBand.setData(bbData.map(d => ({ time: d.time, value: d.lower })));
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

    // Create MACD chart if enabled
    let macdChart: IChartApi | null = null;
    if (showMACD && macdContainerRef.current) {
      macdChart = createChart(macdContainerRef.current, {
        width: macdContainerRef.current.clientWidth,
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

      macdChartRef.current = macdChart;

      const macdData = calculateMACD(data, 12, 26, 9);

      // MACD line
      const macdLine = macdChart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        title: 'MACD',
      });
      macdLine.setData(macdData.map(d => ({ time: d.time, value: d.macd })));

      // Signal line
      const signalLine = macdChart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'Signal',
      });
      signalLine.setData(macdData.map(d => ({ time: d.time, value: d.signal })));

      // Histogram
      const histogramSeries = macdChart.addHistogramSeries({
        color: '#10b981',
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      });
      histogramSeries.setData(
        macdData.map(d => ({
          time: d.time,
          value: d.histogram,
          color: d.histogram >= 0 ? '#10b981' : '#ef4444',
        }))
      );

      // Add zero line
      const zeroLine = macdChart.addLineSeries({
        color: '#6b7280',
        lineWidth: 1,
        lineStyle: 2,
      });
      zeroLine.setData([
        { time: data[0].time, value: 0 },
        { time: data[data.length - 1].time, value: 0 },
      ]);

      // Sync time scales
      chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange && macdChart) {
          macdChart.timeScale().setVisibleRange(timeRange);
        }
      });

      macdChart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange) {
          chart.timeScale().setVisibleRange(timeRange);
        }
      });
    }

    // Handle resize
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      let heightOffset = 130;
      if (showRSI) heightOffset += 150;
      if (showMACD) heightOffset += 150;
      const newMainChartHeight = viewportHeight - heightOffset;

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
      if (showMACD && macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth,
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
      if (macdChartRef.current) {
        try {
          macdChartRef.current.remove();
        } catch (error) {
          // Chart already disposed, ignore error
        }
        macdChartRef.current = null;
      }
    };
  }, [data, supportLevel, resistanceLevel, showMA, showEMA, showRSI, showMACD, showBB, publishTime]);

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
      {showMACD && (
        <div
          ref={macdContainerRef}
          className="w-full bg-gray-800 rounded-lg border border-gray-700"
        />
      )}
    </div>
  );
}
