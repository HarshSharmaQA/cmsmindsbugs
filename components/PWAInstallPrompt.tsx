'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  standalone?: boolean;
  MSStream?: unknown;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const navStandalone = 'standalone' in window.navigator ? !!window.navigator.standalone : false;
    const isStandaloneMode: boolean = mediaQuery.matches ||
      navStandalone ||
      document.referrer.includes('android-app://');

    const iOS: boolean = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    // Batch state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setIsStandalone(isStandaloneMode);
      setIsIOS(iOS);
    });

    let handleBeforeInstallPrompt: ((e: Event) => void) | null = null;

    if (!isStandaloneMode) {
      handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);

        setTimeout(() => {
          const dismissed = localStorage.getItem('pwa-install-dismissed');
          if (!dismissed) {
            setShowInstallPrompt(true);
          }
        }, 30000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      if (iOS) {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setTimeout(() => setShowInstallPrompt(true), 30000);
        }
      }
    }

    return () => {
      if (handleBeforeInstallPrompt) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Install BugScribe
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {isIOS 
              ? 'Add to your home screen for quick access and offline support.'
              : 'Install the app for a better experience with offline support.'}
          </p>

          {isIOS ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium">To install:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the <Share className="inline w-4 h-4" /> Share button</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; in the top right</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
