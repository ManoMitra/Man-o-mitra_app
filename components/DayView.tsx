
import React from 'react';
import { Reminder, Location } from '../types';
import { PlusIcon, MapPinIcon } from './Icons';

interface DayViewProps {
  date: Date;
  reminders: Reminder[];
  onAddReminder: (time: string) => void;
  onEditReminder: (reminder: Reminder) => void;
  locations: Location[];
}

const DayView: React.FC<DayViewProps> = ({ date, reminders, onAddReminder, onEditReminder, locations }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const remindersByHour = new Map<number, Reminder[]>();
  reminders.forEach(r => {
    const hour = parseInt(r.time.split(':')[0], 10);
    if (!remindersByHour.has(hour)) {
      remindersByHour.set(hour, []);
    }
    remindersByHour.get(hour)?.push(r);
  });
  
  const now = new Date();
  const selectedDay = new Date(date);
  selectedDay.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const isToday = selectedDay.getTime() === today.getTime();


  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        {date.toLocaleDateString('default', { weekday: 'long' })}
      </h2>
      <p className="text-gray-500 mb-4">
        {date.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <div className="h-[60vh] overflow-y-auto pr-2">
        <div className="relative">
          {hours.map(hour => {
            const timeLabel = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            const hourReminders = remindersByHour.get(hour) || [];
            const isPastHour = isToday && hour < now.getHours();

            return (
              <div key={hour} className="flex items-start min-h-[60px] border-t border-gray-200">
                <div className="w-20 text-right pr-4 pt-2 text-sm text-gray-500">{timeLabel}</div>
                <div className="flex-1 pt-2 border-l border-gray-200 pl-4 relative group">
                   {hourReminders.map(reminder => {
                      if (reminder.reminderType === 'timed-location') {
                        const location = locations.find(l => l.id === reminder.locationId);
                        return (
                           <div key={reminder.id} onClick={() => onEditReminder(reminder)} className="bg-purple-100 border-l-4 border-purple-500 text-purple-800 p-2 rounded-r-md mb-2 cursor-pointer hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="w-4 h-4 text-purple-700 shrink-0"/>
                                  <p className="font-semibold text-sm">{reminder.title}</p>
                                </div>
                                <p className="text-xs text-purple-700 mt-1">{location?.address}</p>
                                <p className="text-xs font-medium text-purple-700 mt-2">Max time: {reminder.maxTime} minutes</p>
                                <p className="text-xs font-mono mt-1 text-purple-700">{reminder.time}</p>
                            </div>
                        )
                      }
                      
                      // Standard reminder
                      return (
                        <div key={reminder.id} onClick={() => onEditReminder(reminder)} className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-2 rounded-r-md mb-2 cursor-pointer hover:shadow-md transition-shadow">
                            <p className="font-semibold text-sm">{reminder.title}</p>
                            <p className="text-xs">{reminder.description}</p>
                            <p className="text-xs font-mono mt-1">{reminder.time}</p>
                        </div>
                      )
                   })}
                   <button 
                      onClick={() => onAddReminder(`${String(hour).padStart(2, '0')}:00`)} 
                      disabled={isPastHour}
                      className="absolute top-1 right-1 p-1 rounded-full text-gray-400 bg-white opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed"
                   >
                      <PlusIcon className="w-4 h-4" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
