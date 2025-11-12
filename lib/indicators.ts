import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorData {
  time: number;
  value: number;
}

export function calculateSMA(data: CandleData[], period: number = 20): IndicatorData[] {
  const closes = data.map((d) => d.close);
  const smaValues = SMA.calculate({ period, values: closes });

  // Map back to time-value pairs, accounting for the period offset
  return smaValues.map((value, index) => ({
    time: data[index + period - 1].time,
    value,
  }));
}

export function calculateEMA(data: CandleData[], period: number = 20): IndicatorData[] {
  const closes = data.map((d) => d.close);
  const emaValues = EMA.calculate({ period, values: closes });

  return emaValues.map((value, index) => ({
    time: data[index + period - 1].time,
    value,
  }));
}

export function calculateRSI(data: CandleData[], period: number = 14): IndicatorData[] {
  const closes = data.map((d) => d.close);
  const rsiValues = RSI.calculate({ period, values: closes });

  return rsiValues.map((value, index) => ({
    time: data[index + period].time,
    value,
  }));
}

export interface MACDData {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  data: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  const closes = data.map((d) => d.close);
  const macdResults = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const offset = slowPeriod + signalPeriod - 2;

  return macdResults.map((result, index) => ({
    time: data[index + offset].time,
    macd: result.MACD || 0,
    signal: result.signal || 0,
    histogram: result.histogram || 0,
  }));
}

export interface BollingerBandsData {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export function calculateBollingerBands(
  data: CandleData[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsData[] {
  const closes = data.map((d) => d.close);
  const bbResults = BollingerBands.calculate({
    values: closes,
    period,
    stdDev,
  });

  return bbResults.map((result, index) => ({
    time: data[index + period - 1].time,
    upper: result.upper || 0,
    middle: result.middle || 0,
    lower: result.lower || 0,
  }));
}
