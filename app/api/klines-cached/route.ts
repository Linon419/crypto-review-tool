import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ccxt from 'ccxt';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1h';
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter required' },
        { status: 400 }
      );
    }

    // Get coin settings for this user and symbol
    const normalizedSymbol = symbol.replace('/', '');
    const coinSettings = await prisma.coinSettings.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: normalizedSymbol,
        },
      },
    });

    // If no settings exist, fall back to regular API
    if (!coinSettings) {
      return await fetchFromBinance(symbol, timeframe, undefined, 500);
    }

    // Check if cached data exists
    if (!forceRefresh) {
      const cachedData = await prisma.kline.findMany({
        where: {
          coinSettingsId: coinSettings.id,
          timeframe,
        },
        orderBy: {
          time: 'asc',
        },
      });

      if (cachedData.length > 0) {
        console.log(`Cache hit: ${symbol} ${timeframe} (${cachedData.length} candles)`);
        const formattedData = cachedData.map(k => ({
          time: k.time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
        }));
        return NextResponse.json({
          symbol,
          timeframe,
          data: formattedData,
          cached: true,
        });
      }
    }

    // No cache or force refresh - fetch from Binance and cache
    console.log(`Cache miss: ${symbol} ${timeframe}, fetching from Binance...`);

    const publishDate = new Date(coinSettings.publishTime);
    const startTime = new Date(publishDate);
    startTime.setDate(startTime.getDate() - 1);
    const endTime = new Date(publishDate);
    endTime.setDate(endTime.getDate() + 4);

    const allData = await fetchCompleteData(
      symbol,
      timeframe,
      startTime.getTime(),
      endTime.getTime()
    );

    // Store in database
    if (allData.length > 0) {
      // Delete existing cache for this timeframe
      await prisma.kline.deleteMany({
        where: {
          coinSettingsId: coinSettings.id,
          timeframe,
        },
      });

      // Insert new data
      await prisma.kline.createMany({
        data: allData.map(candle => ({
          coinSettingsId: coinSettings.id,
          symbol: normalizedSymbol,
          timeframe,
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        })),
        skipDuplicates: true,
      });

      console.log(`Cached ${allData.length} candles for ${symbol} ${timeframe}`);
    }

    return NextResponse.json({
      symbol,
      timeframe,
      data: allData,
      cached: false,
    });
  } catch (error: any) {
    console.error('Fetch klines cached error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

async function fetchFromBinance(
  symbol: string,
  timeframe: string,
  since?: number,
  limit: number = 500
) {
  const exchange = new ccxt.binance({ enableRateLimit: true });
  const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);

  const formattedData = ohlcv.map((candle) => ({
    time: candle[0] / 1000,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5],
  }));

  return NextResponse.json({ symbol, timeframe, data: formattedData });
}

async function fetchCompleteData(
  symbol: string,
  timeframe: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<CandleData[]> {
  const timeframeToMinutes: { [key: string]: number } = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
  };

  const minutesPerCandle = timeframeToMinutes[timeframe] || 60;
  const totalMinutes = (endTimestamp - startTimestamp) / (1000 * 60);
  const requiredLimit = Math.ceil(totalMinutes / minutesPerCandle);
  const maxPerRequest = 1000;

  console.log('fetchCompleteData:', {
    symbol,
    timeframe,
    startTime: new Date(startTimestamp).toISOString(),
    endTime: new Date(endTimestamp).toISOString(),
    totalMinutes,
    minutesPerCandle,
    requiredLimit,
    maxPerRequest,
    needsBatching: requiredLimit > maxPerRequest,
  });

  const exchange = new ccxt.binance({ enableRateLimit: true });
  let allData: CandleData[] = [];

  if (requiredLimit <= maxPerRequest) {
    console.log('Single batch fetch...');
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, startTimestamp, requiredLimit);
    console.log(`Fetched ${ohlcv.length} candles`);
    allData = ohlcv.map((candle) => ({
      time: candle[0] / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } else {
    const numBatches = Math.ceil(requiredLimit / maxPerRequest);
    let currentSince = startTimestamp;

    console.log(`Multi-batch fetch: ${numBatches} batches needed`);

    for (let i = 0; i < numBatches; i++) {
      if (currentSince >= endTimestamp) {
        console.log(`Batch ${i + 1}: Reached end time, stopping`);
        break;
      }

      console.log(`Batch ${i + 1}/${numBatches}: Fetching from ${new Date(currentSince).toISOString()}`);

      const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, currentSince, maxPerRequest);

      console.log(`Batch ${i + 1}: Received ${ohlcv.length} candles`);

      if (ohlcv.length === 0) {
        console.log(`Batch ${i + 1}: No data returned, stopping`);
        break;
      }

      const batchData = ohlcv.map((candle) => ({
        time: candle[0] / 1000,
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));

      allData = allData.concat(batchData);

      const lastCandle = batchData[batchData.length - 1];
      const lastCandleTime = new Date(lastCandle.time * 1000).toISOString();
      currentSince = (lastCandle.time * 1000) + (minutesPerCandle * 60 * 1000);

      console.log(`Batch ${i + 1}: Last candle at ${lastCandleTime}, next since: ${new Date(currentSince).toISOString()}`);

      if (currentSince >= endTimestamp) {
        console.log(`Batch ${i + 1}: Next batch would exceed end time, stopping`);
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Total fetched: ${allData.length} candles`);
  }

  // Remove duplicates and filter to time range
  const uniqueData = Array.from(
    new Map(allData.map(item => [item.time, item])).values()
  );

  const filteredData = uniqueData.filter(
    candle => candle.time * 1000 >= startTimestamp && candle.time * 1000 <= endTimestamp
  );

  filteredData.sort((a, b) => a.time - b.time);

  console.log('Final data:', {
    totalFetched: allData.length,
    afterDeduplication: uniqueData.length,
    afterFiltering: filteredData.length,
    timeRange: {
      start: filteredData[0] ? new Date(filteredData[0].time * 1000).toISOString() : 'N/A',
      end: filteredData[filteredData.length - 1] ? new Date(filteredData[filteredData.length - 1].time * 1000).toISOString() : 'N/A',
    },
  });

  return filteredData;
}
