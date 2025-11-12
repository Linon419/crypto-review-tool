'use client';

import { useEffect, useState } from 'react';

interface CoinSetting {
  id: string;
  symbol: string;
  publishTime: string;
  zoneType: 'support' | 'resistance';
  zonePrice: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CoinSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSymbol, setEditingSymbol] = useState('');
  const [formData, setFormData] = useState({
    symbol: '',
    publishTime: new Date().toISOString().slice(0, 16),
    zoneType: 'support' as 'support' | 'resistance',
    zonePrice: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: CoinSetting) => {
    setEditingSymbol(setting.symbol);
    setFormData({
      symbol: setting.symbol,
      publishTime: new Date(setting.publishTime).toISOString().slice(0, 16),
      zoneType: setting.zoneType,
      zonePrice: setting.zonePrice.toString(),
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!formData.symbol || !formData.zonePrice) {
      setError('Please fill in all fields');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase().replace('/', ''),
          publishTime: new Date(formData.publishTime).toISOString(),
          zoneType: formData.zoneType,
          zonePrice: parseFloat(formData.zonePrice),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Settings saved successfully!');
        setFormData({
          symbol: '',
          publishTime: new Date().toISOString().slice(0, 16),
          zoneType: 'support',
          zonePrice: '',
        });
        setEditingSymbol('');
        fetchSettings();
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (symbol: string) => {
    if (!confirm(`Delete settings for ${symbol}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/settings?symbol=${symbol}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Settings deleted successfully!');
        fetchSettings();
        if (editingSymbol === symbol) {
          setEditingSymbol('');
          setFormData({
            symbol: '',
            publishTime: new Date().toISOString().slice(0, 16),
            zoneType: 'support',
            zonePrice: '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to delete settings:', err);
    }
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
        <h1 className="text-3xl font-bold text-white mb-2">
          Coin Settings
        </h1>
        <p className="text-gray-400">
          Configure support and resistance zones for your trading pairs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingSymbol ? `Edit Settings for ${editingSymbol}` : 'Add New Settings'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trading Pair Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData({ ...formData, symbol: e.target.value })
                }
                placeholder="e.g., BTCUSDT"
                disabled={!!editingSymbol}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zone Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="support"
                    checked={formData.zoneType === 'support'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                    checked={formData.zoneType === 'resistance'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zone Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.zonePrice}
                onChange={(e) =>
                  setFormData({ ...formData, zonePrice: e.target.value })
                }
                placeholder="Enter price level"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Publish Time
              </label>
              <input
                type="datetime-local"
                value={formData.publishTime}
                onChange={(e) =>
                  setFormData({ ...formData, publishTime: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                {saving ? 'Saving...' : editingSymbol ? 'Update' : 'Save'}
              </button>
              {editingSymbol && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSymbol('');
                    setFormData({
                      symbol: '',
                      publishTime: new Date().toISOString().slice(0, 16),
                      zoneType: 'support',
                      zonePrice: '',
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Configured Coins ({settings.length})
          </h2>

          {settings.length === 0 ? (
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-400">No coin settings configured yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Add settings to mark support and resistance zones
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {setting.symbol}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(setting.publishTime).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        setting.zoneType === 'support'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {setting.zoneType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mb-3">
                    ${setting.zonePrice.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(setting)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(setting.symbol)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
