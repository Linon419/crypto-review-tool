import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

let symbolsCache: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toUpperCase() || '';

    // Check if cache is still valid
    const now = Date.now();
    if (!symbolsCache || now - cacheTimestamp > CACHE_DURATION) {
      // Fetch fresh symbols from Binance
      const exchange = new ccxt.binance({
        enableRateLimit: true,
      });

      await exchange.loadMarkets();
      symbolsCache = Object.keys(exchange.markets);
      cacheTimestamp = now;
    }

    // Filter symbols based on query
    let filteredSymbols = symbolsCache;

    if (query) {
      filteredSymbols = symbolsCache.filter((symbol) => {
        // Match symbols that start with the query or contain it
        return symbol.includes(query);
      });

      // Sort results: prioritize symbols that start with the query
      filteredSymbols.sort((a, b) => {
        const aStartsWith = a.startsWith(query);
        const bStartsWith = b.startsWith(query);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // For USDT pairs, prioritize them
        const aIsUSDT = a.endsWith('/USDT');
        const bIsUSDT = b.endsWith('/USDT');

        if (aIsUSDT && !bIsUSDT) return -1;
        if (!aIsUSDT && bIsUSDT) return 1;

        return a.localeCompare(b);
      });
    } else {
      // If no query, return USDT pairs sorted alphabetically
      filteredSymbols = symbolsCache
        .filter((symbol) => symbol.endsWith('/USDT'))
        .sort();
    }

    // Limit results to 20 for performance
    const limitedResults = filteredSymbols.slice(0, 20);

    return NextResponse.json({
      symbols: limitedResults,
      total: filteredSymbols.length,
    });
  } catch (error: any) {
    console.error('Fetch symbols error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch symbols' },
      { status: 500 }
    );
  }
}
