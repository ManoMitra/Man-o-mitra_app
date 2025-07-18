import React from 'react';
import { MicrophoneIcon, PlusIcon } from './Icons';

interface FloatingActionButtonsProps {
  onMicClick: () => void;
  onPlusClick: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ onMicClick, onPlusClick }) => (
  <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
    <button
      onClick={onMicClick}
      className="w-14 h-14 rounded-full bg-green-500 shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
      aria-label="Open Reminder Test Panel"
    >
      <MicrophoneIcon className="w-7 h-7 text-white" />
    </button>
    <button
      onClick={onPlusClick}
      className="w-14 h-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      aria-label="Add Reminder"
    >
      <PlusIcon className="w-7 h-7 text-white" />
    </button>
  </div>
);

export default FloatingActionButtons; 