import { useState, useEffect } from 'react';

interface TimerProps {
  endDate: string;
  onExpire?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculateTimeLeft(endDate: string): TimeLeft {
  const difference = new Date(endDate).getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    expired: false,
  };
}

export function Timer({ endDate, onExpire, className = '' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate);
      setTimeLeft(newTimeLeft);
      if (newTimeLeft.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  if (timeLeft.expired) {
    return <span className={`text-red-600 font-medium ${className}`}>Auction Ended</span>;
  }

  const formatUnit = (value: number, unit: string) => (
    <span className="inline-flex flex-col items-center">
      <span className="text-lg font-bold text-slate-800">{String(value).padStart(2, '0')}</span>
      <span className="text-xs text-slate-500 uppercase">{unit}</span>
    </span>
  );

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 1;

  return (
    <div className={`flex gap-3 ${isUrgent ? 'text-red-600' : ''} ${className}`}>
      {timeLeft.days > 0 && formatUnit(timeLeft.days, 'days')}
      {formatUnit(timeLeft.hours, 'hrs')}
      {formatUnit(timeLeft.minutes, 'min')}
      {formatUnit(timeLeft.seconds, 'sec')}
    </div>
  );
}
