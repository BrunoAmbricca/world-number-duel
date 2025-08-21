'use client';

import { useEffect } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm mx-auto w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300 md:max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ×
        </button>

        {/* Modal Body - Exact content from StartScreen */}
        <div className="p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center pr-8">
            How to Play
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Game Rules:
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Numbers will appear one by one</li>
                <li>• Each number can be positive (+) or negative (-)</li>
                <li>• Remember all the numbers</li>
                <li>• Calculate their total sum</li>
                <li>• Enter your answer within 5 seconds</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Tips:
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Focus on each number as it appears</li>
                <li>• Keep a running total in your head</li>
                <li>• Practice with single player first</li>
                <li>• Speed and accuracy both matter</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};