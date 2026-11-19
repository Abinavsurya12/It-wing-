import React, { useState, useEffect } from 'react';

/**
 * TVK Digital Governance CRM - Minimal Startup Loading Screen
 * Pure white full-screen background with a small, elegant circular spinner
 * (subtle grey track, smooth blue animation), live 0% to 100% progress counter,
 * and a slim synchronized horizontal progress bar.
 */
export const StartupLoadingScreen = ({ isReady = true, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Dynamic staged progression reflecting actual initialization stages:
    // 0% -> 25%: Mounting & DOM initialization
    // 25% -> 60%: Local storage & auth session verification
    // 60% -> 88%: Server authentication verification (held until isReady is true)
    // 88% -> 100%: Route resolution confirmed & application ready
    const interval = setInterval(() => {
      setProgress((prev) => {
        const ceiling = isReady ? 100 : 88;

        if (prev < ceiling) {
          const remaining = ceiling - prev;
          const step = Math.max(1, Math.min(3, Math.ceil(remaining * 0.08)));
          const next = Math.min(ceiling, prev + step);
          return next;
        } else if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isReady]);

  // Smooth exit transition once 100% is displayed
  useEffect(() => {
    if (progress >= 100) {
      const displayTimer = setTimeout(() => {
        setIsFading(true);
        const exitTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 180);
        return () => clearTimeout(exitTimer);
      }, 70);
      return () => clearTimeout(displayTimer);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-white z-[99999] flex flex-col items-center justify-center p-4 overflow-hidden select-none transition-opacity duration-200 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="w-full max-w-xs flex flex-col items-center justify-center text-center">
        {/* Small Elegant Circular Spinner with Subtle Grey Track & Smooth Blue Progress Animation */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 mb-3.5">
          {/* Subtle Grey Circular Track */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
          {/* Smooth Blue Progress Animation */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
        </div>

        {/* Live Loading Percentage (0% to 100%) */}
        <div className="flex items-baseline justify-center space-x-0.5 mb-2.5">
          <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono tracking-tight">
            {Math.round(progress)}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
            %
          </span>
        </div>

        {/* Slim, Clean Horizontal Progress Bar (Synchronized with Percentage) */}
        <div className="w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StartupLoadingScreen;
