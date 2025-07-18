import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { textToSpeech } from '../services/textToSpeech';
import { reminderNotification } from '../services/reminderNotification';

interface ReminderTestPanelProps {
  reminders: Reminder[];
  isOpen: boolean;
  onClose: () => void;
}

const ReminderTestPanel: React.FC<ReminderTestPanelProps> = ({ reminders, isOpen, onClose }) => {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male' | 'hindi-female' | 'hindi-male'>('female');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');

  useEffect(() => {
    if (isOpen) {
      // Load available voices with a delay to ensure voices are loaded
      const loadVoices = () => {
        const voices = textToSpeech.getAvailableVoices();
        setAvailableVoices(voices);
        
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Try to find a female voice first
        const femaleVoice = voices.find(v => 
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('nicky') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('hazel')
        );
        
        if (femaleVoice) {
          setSelectedVoice(femaleVoice.name);
        } else if (voices.length > 0) {
          setSelectedVoice(voices[0].name);
        }
      };

      // Load voices immediately
      loadVoices();
      
      // Also try again after a short delay to catch voices that load later
      setTimeout(loadVoices, 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (availableVoices.length === 0) return;

    if (selectedLanguage === 'english') {
      const englishVoice = availableVoices.find(
        v => v.lang && v.lang.toLowerCase().startsWith('en')
      );
      if (englishVoice) setSelectedVoice(englishVoice.name);
    } else if (selectedLanguage === 'hindi') {
      const hindiVoice = availableVoices.find(
        v =>
          (v.lang && v.lang.toLowerCase().startsWith('hi')) ||
          (v.lang && v.lang.toLowerCase().includes('in')) ||
          (v.name && v.name.toLowerCase().includes('hindi'))
      );
      if (hindiVoice) setSelectedVoice(hindiVoice.name);
    }
  }, [selectedLanguage, availableVoices]);

  const handleTestReminder = async (reminder: Reminder) => {
    if (!speechEnabled) return;

    setIsSpeaking(true);
    try {
      await reminderNotification.testReminderWithVoice(reminder, selectedVoice, selectedLanguage);
    } catch (error) {
      console.error('Failed to test reminder:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleTestCustomSpeech = async () => {
    if (!selectedReminder) return;

    setIsSpeaking(true);
    try {
      let speechText: string;
      
      if (selectedLanguage === 'hindi') {
        speechText = textToSpeech.translateToHindi(selectedReminder.title, selectedReminder.description, formatTimeForSpeech(selectedReminder.time));
      } else {
        const timeText = formatTimeForSpeech(selectedReminder.time);
        const descriptionText = selectedReminder.description ? ` ${selectedReminder.description}` : '';
        speechText = `It is ${timeText}, time to ${selectedReminder.title.toLowerCase()}.${descriptionText}`;
      }
      
      await textToSpeech.speakWithVoice(speechText, selectedVoice, {
        rate: 0.85,
        pitch: 1.05
      });
    } catch (error) {
      console.error('Failed to speak reminder:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const formatTimeForSpeech = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // More natural time formatting
    if (minutes === 0) {
      return `${hour} ${ampm}`;
    } else if (minutes === 15) {
      return `${hour} 15 ${ampm}`;
    } else if (minutes === 30) {
      return `${hour} 30 ${ampm}`;
    } else if (minutes === 45) {
      return `${hour} 45 ${ampm}`;
    } else {
      return `${hour} ${minutes} ${ampm}`;
    }
  };

  const handleStopSpeech = () => {
    textToSpeech.stop();
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Reminder Test Panel</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 mt-1">Test text-to-speech functionality for your reminders</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Text-to-Speech</label>
                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    speechEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      speechEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLanguage('english')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedLanguage === 'english' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('hindi')}
                    className={`px-3 py-1 text-xs rounded-md ${
                      selectedLanguage === 'hindi' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Hindi
                  </button>
                </div>
              </div>
              {availableVoices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableVoices
                      .filter(voice => {
                        if (selectedLanguage === 'english') {
                          return voice.lang && voice.lang.toLowerCase().startsWith('en');
                        } else if (selectedLanguage === 'hindi') {
                          return (
                            (voice.lang && voice.lang.toLowerCase().startsWith('hi')) ||
                            (voice.lang && voice.lang.toLowerCase().includes('in')) ||
                            (voice.name && voice.name.toLowerCase().includes('hindi'))
                          );
                        }
                        return false;
                      })
                      .map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </select>
                  {selectedLanguage === 'hindi' &&
                    availableVoices.filter(voice =>
                      (voice.lang && voice.lang.toLowerCase().startsWith('hi')) ||
                      (voice.lang && voice.lang.toLowerCase().includes('in')) ||
                      (voice.name && voice.name.toLowerCase().includes('hindi'))
                    ).length === 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        No Hindi voices available in your browser.
                      </div>
                    )
                  }
                </div>
              )}
            </div>
          </div>

                     {/* Test Controls */}
           <div className="bg-blue-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-blue-900 mb-3">Test Controls</h3>
             <div className="flex gap-3">
               <button
                 onClick={handleStopSpeech}
                 disabled={!isSpeaking}
                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
               >
                 Stop Speech
               </button>
               <button
                 onClick={() => textToSpeech.speakWithVoice('This is a test of the text to speech system.', selectedVoice)}
                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
               >
                 Test Speech
               </button>
             </div>
           </div>



          {/* Reminders List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Reminders</h3>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reminders available for testing</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {reminder.date} at {reminder.time} ({reminder.reminderType})
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleTestReminder(reminder)}
                          disabled={!speechEnabled || isSpeaking}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => setSelectedReminder(reminder)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Reminder Test */}
          {selectedReminder && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Selected Reminder</h3>
              <div className="mb-3">
                <p className="font-medium text-green-900">{selectedReminder.title}</p>
                {selectedReminder.description && (
                  <p className="text-sm text-green-700 mt-1">{selectedReminder.description}</p>
                )}
                <p className="text-xs text-green-600 mt-2">
                  {selectedReminder.date} at {selectedReminder.time}
                </p>
              </div>
              <button
                onClick={handleTestCustomSpeech}
                disabled={!speechEnabled || isSpeaking}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test Selected Reminder
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isSpeaking && <span className="text-blue-600">Speaking...</span>}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderTestPanel; 