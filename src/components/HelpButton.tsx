'use client';

import { useState } from 'react';
import { HowToPlayModal } from './HowToPlayModal';

export const HelpButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 z-40 flex items-center justify-center text-2xl font-bold"
        aria-label="How to Play"
      >
        ?
      </button>

      {/* Modal */}
      <HowToPlayModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};