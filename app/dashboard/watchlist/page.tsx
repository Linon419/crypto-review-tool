'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SymbolAutocomplete from '@/components/SymbolAutocomplete';

interface WatchlistItem {
  id: string;
  symbol: string;
  createdAt: string;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsData, setSettingsData] = useState({
    zoneType: 'support' as 'support' | 'resistance',
    zonePrice: '',
    publishTime: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbol = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setAdding(true);

    // Format symbol to uppercase
    const formattedSymbol = newSymbol.toUpperCase().trim();

    if (!formattedSymbol) {
      setError('Please enter a symbol');
      setAdding(false);
      return;
    }

    // Validate settings if enabled
    if (showSettings && !settingsData.zonePrice) {
      setError('Please enter a zone price or disable settings');
      setAdding(false);
      return;
    }

    try {
      // Add to watchlist
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: formattedSymbol }),
      });

      const data = await response.json();

      if (response.ok) {
        setWatchlist([data, ...watchlist]);

        // Save settings if enabled
        if (showSettings && settingsData.zonePrice) {
          try {
            await fetch('/api/settings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                symbol: formattedSymbol,
                publishTime: new Date(settingsData.publishTime).toISOString(),
                zoneType: settingsData.zoneType,
                zonePrice: parseFloat(settingsData.zonePrice),
              }),
            });
          } catch (settingsErr) {
            console.error('Failed to save settings:', settingsErr);
            // Don't fail the whole operation if settings fail
          }
        }

        // Reset form
        setNewSymbol('');
        setSettingsData({
          zoneType: 'support',
          zonePrice: '',
          publishTime: new Date().toISOString().slice(0, 16),
        });
        setShowSettings(false);
      } else {
        setError(data.error || 'Failed to add symbol');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist?symbol=${symbol}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
      }
    } catch (err) {
      console.error('Failed to remove symbol:', err);
    }
  };

  const handleViewChart = (symbol: string) => {
    router.push(`/dashboard/chart?symbol=${symbol}`);
  };

  const handleSymbolSelect = (symbol: string) => {
    setNewSymbol(symbol);
    // Optionally trigger add immediately
    // handleAddSymbol();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-white text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Watchlist</h1>
        <p className="text-gray-400">
          Manage your cryptocurrency trading pairs
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Add New Symbol
        </h2>
        <form onSubmit={handleAddSymbol} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <SymbolAutocomplete
                value={newSymbol}
                onChange={setNewSymbol}
                onSelect={handleSymbolSelect}
                placeholder="e.g., BTC/USDT, ETH/USDT"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>

          {/* Toggle for coin settings */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSettings"
              checked={showSettings}
              onChange={(e) => setShowSettings(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="showSettings" className="text-sm text-gray-300 cursor-pointer">
              Configure coin settings (support/resistance zones)
            </label>
          </div>

          {/* Coin Settings Form */}
          {showSettings && (
            <div className="bg-gray-750 border border-gray-600 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white mb-2">Coin Settings</h3>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Zone Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="support"
                      checked={settingsData.zoneType === 'support'}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          zoneType: e.target.value as 'support' | 'resistance',
                        })
                      }
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600"
                    />
                    <span className="text-sm text-gray-300">Support</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="resistance"
                      checked={settingsData.zoneType === 'resistance'}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          zoneType: e.target.value as 'support' | 'resistance',
                        })
                      }
                      className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600"
                    />
                    <span className="text-sm text-gray-300">Resistance</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Zone Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settingsData.zonePrice}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, zonePrice: e.target.value })
                  }
                  placeholder="Enter price level"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Publish Time
                </label>
                <input
                  type="datetime-local"
                  value={settingsData.publishTime}
                  onChange={(e) =>
                    setSettingsData({ ...settingsData, publishTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <p className="text-gray-400 text-sm">
            Enter trading pair symbols (e.g., BTCUSDT for Bitcoin/USDT)
          </p>
        </form>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Your Watchlist ({watchlist.length})
        </h2>

        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-400">No symbols in your watchlist yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Add some trading pairs to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">
                    {item.symbol}
                  </h3>
                  <button
                    onClick={() => handleRemoveSymbol(item.symbol)}
                    className="text-red-400 hover:text-red-300 transition"
                    title="Remove"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => handleViewChart(item.symbol)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                >
                  View Chart
                </button>
                <p className="text-gray-400 text-xs mt-2">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
