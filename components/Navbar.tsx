'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : 'hover:bg-gray-700';
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Crypto Review
            </Link>

            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium text-white transition ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/watchlist"
                className={`px-3 py-2 rounded-md text-sm font-medium text-white transition ${isActive('/dashboard/watchlist')}`}
              >
                Watchlist
              </Link>
              <Link
                href="/dashboard/chart"
                className={`px-3 py-2 rounded-md text-sm font-medium text-white transition ${isActive('/dashboard/chart')}`}
              >
                Chart
              </Link>
              <Link
                href="/dashboard/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium text-white transition ${isActive('/dashboard/settings')}`}
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <span className="text-gray-300 text-sm">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
