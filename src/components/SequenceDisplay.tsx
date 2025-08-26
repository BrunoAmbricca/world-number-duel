'use client';

import { useEffect, useRef } from 'react';
import { formatNumber } from '@/utils/gameHelpers';

interface SequenceDisplayProps {
  sequence: number[];
  currentIndex: number;
  isDisplaying: boolean;
  onNext: () => void;
  onFinish: () => void;
  timeLeft: number;
  isTimerActive: boolean;
  timerStartTime: number;
  displayInterval?: number; // in milliseconds
}

export const SequenceDisplay = ({ 
  sequence, 
  currentIndex, 
  isDisplaying, 
  onNext, 
  onFinish,
  timeLeft,
  isTimerActive,
  timerStartTime,
  displayInterval = 1000
}: SequenceDisplayProps) => {
  const timerBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDisplaying) return;

    const timer = setTimeout(() => {
      if (currentIndex < sequence.length - 1) {
        onNext();
      } else {
        onFinish();
      }
    }, displayInterval);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence.length, isDisplaying, onNext, onFinish, displayInterval]);

  // Handle timer bar animation
  useEffect(() => {
    if (isTimerActive && timerBarRef.current && timerStartTime > 0) {
      const bar = timerBarRef.current;
      bar.style.transition = 'none';
      bar.style.width = '100%';
      
      setTimeout(() => {
        bar.style.transition = 'width 5s linear';
        bar.style.width = '0%';
      }, 10);
    }
  }, [isTimerActive, timerStartTime]);

  if (!isDisplaying && !isTimerActive) return null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Sequence Display Area */}
      {isDisplaying && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-6xl md:text-8xl font-bold text-blue-600 mb-4 transition-all duration-300 text-center">
            {currentIndex >= 0 && currentIndex < sequence.length
              ? formatNumber(sequence[currentIndex])
              : ''}
          </div>
          <div className="text-lg text-gray-500 mb-4">
            {currentIndex + 1} / {sequence.length}
          </div>
        </div>
      )}

      {/* Timer Bar Section */}
      {isTimerActive && (
        <div className="px-4 pb-6">
          <div className="text-center mb-3">
            <div className="text-sm font-medium text-gray-600">Time remaining</div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              ref={timerBarRef}
              className={`h-full rounded-full transition-colors ${
                timeLeft <= 2 ? 'bg-red-500' : timeLeft <= 3 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};