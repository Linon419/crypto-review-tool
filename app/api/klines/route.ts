import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1h';
    const limit = parseInt(searchParams.get('limit') || '500');
    const since = searchParams.get('since'); // Start time in milliseconds

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter required' },
        { status: 400 }
      );
    }

    // Initialize Binance exchange
    const exchange = new ccxt.binance({
      enableRateLimit: true,
    });

    // Fetch OHLCV data with optional start time
    const sinceTimestamp = since ? parseInt(since) : undefined;
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, sinceTimestamp, limit);

    // Format data for frontend
    const formattedData = ohlcv.map((candle) => ({
      time: candle[0] / 1000, // Convert to seconds
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));

    return NextResponse.json({
      symbol,
      timeframe,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Fetch klines error:', error);

    // Handle specific error types
    let errorMessage = 'Failed to fetch market data';
    let statusCode = 500;

    if (error.constructor.name === 'BadSymbol' || error.message?.includes('does not have market symbol')) {
      errorMessage = `Invalid trading pair: ${searchParams.get('symbol')}. This symbol is not available on Binance.`;
      statusCode = 404;
    } else if (error.constructor.name === 'NetworkError' || error.message?.includes('network')) {
      errorMessage = 'Network error: Unable to connect to exchange. Please try again.';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
