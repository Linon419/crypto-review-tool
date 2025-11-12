'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {session?.user?.name || 'User'}!
        </h1>
        <p className="text-gray-400">
          Crypto intraday trading review and analysis tool
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/watchlist"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-6 transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition">
              Watchlist
            </h2>
            <svg
              className="w-8 h-8 text-blue-500"
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
          </div>
          <p className="text-gray-400">
            Manage your cryptocurrency watchlist and track your favorite trading pairs
          </p>
        </Link>

        <Link
          href="/dashboard/chart"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-6 transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white group-hover:text-green-400 transition">
              Chart Analysis
            </h2>
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-400">
            View candlestick charts with technical indicators for intraday trading analysis
          </p>
        </Link>

        <Link
          href="/dashboard/settings"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-6 transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white group-hover:text-purple-400 transition">
              Settings
            </h2>
            <svg
              className="w-8 h-8 text-purple-500"
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
          </div>
          <p className="text-gray-400">
            Configure coin-specific settings, support and resistance zones
          </p>
        </Link>
      </div>

      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Watchlist Items</p>
            <p className="text-2xl font-bold text-white mt-1">-</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Configured Coins</p>
            <p className="text-2xl font-bold text-white mt-1">-</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Reviews Today</p>
            <p className="text-2xl font-bold text-white mt-1">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
