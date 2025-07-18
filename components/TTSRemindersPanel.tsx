import React from 'react';
import { textToSpeech } from '../services/textToSpeech';

const mockReminders = [
  { id: '1', title: 'Take your morning pills', time: '09:00', description: 'Take the blue pills and green pill along with water.' },
  { id: '2', title: 'Have your lunch', time: '13:00', description: 'Don\'t forget to take your diabetes medication with your meal.' },
  { id: '3', title: 'Go for your afternoon walk', time: '16:00', description: 'Remember to wear your comfortable shoes and take your water bottle.' },
  { id: '4', title: 'Take your evening medication', time: '19:00', description: 'Take the white pills with dinner and don\'t forget to check your blood pressure.' },
];

const TTSRemindersPanel: React.FC = () => {
  const handleSpeak = (reminder: any, language: 'english' | 'hindi') => {
    textToSpeech.speakReminder(reminder, language);
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 max-h-96 bg-white shadow-2xl rounded-xl border border-therapy-sage z-50 overflow-y-auto p-4">
      <h3 className="text-lg font-bold mb-3 text-therapy-forest">Reminders (TTS)</h3>
      <ul className="space-y-3">
        {mockReminders.map(reminder => (
          <li key={reminder.id} className="bg-therapy-mint/20 rounded-lg p-3 flex flex-col gap-2">
            <div className="font-semibold text-therapy-forest">{reminder.title}</div>
            <div className="text-xs text-therapy-forest/70">{reminder.time} - {reminder.description}</div>
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                onClick={() => handleSpeak(reminder, 'english')}
              >
                🔊 English
              </button>
              <button
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                onClick={() => handleSpeak(reminder, 'hindi')}
              >
                🔊 Hindi
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TTSRemindersPanel; 