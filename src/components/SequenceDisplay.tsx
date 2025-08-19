'use client';

import { useEffect } from 'react';
import { formatNumber } from '@/utils/gameHelpers';

interface SequenceDisplayProps {
  sequence: number[];
  currentIndex: number;
  isDisplaying: boolean;
  onNext: () => void;
  onFinish: () => void;
}

export const SequenceDisplay = ({ 
  sequence, 
  currentIndex, 
  isDisplaying, 
  onNext, 
  onFinish 
}: SequenceDisplayProps) => {
  useEffect(() => {
    if (!isDisplaying) return;

    const timer = setTimeout(() => {
      if (currentIndex < sequence.length - 1) {
        onNext();
      } else {
        onFinish();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, sequence.length, isDisplaying, onNext, onFinish]);

  if (!isDisplaying) return null;

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="text-8xl font-bold text-blue-600 mb-4 transition-all duration-300">
        {currentIndex >= 0 && currentIndex < sequence.length
          ? formatNumber(sequence[currentIndex])
          : ''}
      </div>
      <div className="text-gray-500">
        {currentIndex + 1} / {sequence.length}
      </div>
    </div>
  );
};