'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re Offline
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. Some features may not be available until you&apos;re back online.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            What you can still do:
          </h2>
          <ul className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>View previously loaded projects and bugs</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Draft bug reports (will sync when online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Browse cached content</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          Your connection will be restored automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
