import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;
  if (!timeLeft) return null;

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col xl:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center text-red-600 font-semibold mb-3 xl:mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Süre Bitti - Yapılması Gereken Tarih:
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 text-red-900 font-mono text-base sm:text-lg font-bold">
          <div className="bg-red-200 px-3 py-1 rounded-md tracking-wider">
            {format(new Date(targetDate), 'dd.MM.yyyy')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col xl:flex-row items-center justify-between shadow-sm">
      <div className="flex items-center text-orange-600 font-semibold mb-3 xl:mb-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Sonraki Muayeneye Kalan Süre
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 text-orange-900 font-mono text-base sm:text-lg font-bold">
        <div className="bg-orange-200 px-2 sm:px-3 py-1 rounded-md">{timeLeft.days} <span className="text-xs font-sans font-normal text-orange-700">gün</span></div>
        <span className="text-orange-300 font-sans">:</span>
        <div className="bg-orange-200 px-2 py-1 rounded-md">{timeLeft.hours.toString().padStart(2, '0')}</div>
        <span className="text-orange-300 font-sans">:</span>
        <div className="bg-orange-200 px-2 py-1 rounded-md">{timeLeft.minutes.toString().padStart(2, '0')}</div>
        <span className="text-orange-300 font-sans">:</span>
        <div className="bg-orange-200 px-2 py-1 rounded-md">{timeLeft.seconds.toString().padStart(2, '0')}</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
