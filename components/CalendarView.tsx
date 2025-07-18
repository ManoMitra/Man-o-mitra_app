
import React, { useState } from 'react';
import ReminderModal from './ReminderModal';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Reminder {
  id?: string;  // Make id optional to match ReminderModal
  title: string;
  date: Date;
  time: string;
  description: string;
  location?: Location;
}

interface CalendarViewProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  reminders?: Reminder[];
  onAddReminder?: (date: Date) => void;
  onEditReminder?: (reminder: Reminder) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate = new Date(),
  onDateChange = () => {},
  reminders = [],
  onAddReminder,
  onEditReminder
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selectedDate));  // Ensure we create a new Date instance
  const [selectedReminder, setSelectedReminder] = useState<Reminder | undefined>();
  const [modalDate, setModalDate] = useState<Date>(new Date(selectedDate));  // Ensure we create a new Date instance

  // Mock locations - in a real app, this would come from props or an API
  const mockLocations: Location[] = [
    { id: '1', name: 'Home', address: '123 Home Street' },
    { id: '2', name: 'Doctor\'s Office', address: '456 Medical Plaza' },
    { id: '3', name: 'Pharmacy', address: '789 Health Avenue' },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handleSaveReminder = (reminder: Reminder) => {
    // Here you would typically save the reminder to your backend
    console.log('Saving reminder:', reminder);
    setSelectedReminder(undefined);
  };

  const handleDeleteReminder = (id: string) => {
    // Here you would typically delete the reminder from your backend
    console.log('Deleting reminder:', id);
    setSelectedReminder(undefined);
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: JSX.Element[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-therapy-mint/10 rounded-lg" />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      const dayReminders = reminders.filter(reminder => 
        reminder.date.toDateString() === date.toDateString()
      );

      days.push(
        <div
          key={day}
          className={`h-24 p-2 border border-therapy-sage/10 rounded-lg transition-all duration-200
                     ${isPast ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-therapy-mint/20'}
                     ${isToday && !isPast ? 'bg-therapy-mint/30' : (!isPast ? 'bg-therapy-mint/10' : '')}`}
          onClick={() => {
            if (!isPast && onAddReminder) onAddReminder(date);
          }}
        >
          <div className="font-semibold text-therapy-forest">{day}</div>
          {dayReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`text-xs mt-1 p-1 rounded ${isPast ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-therapy-sage text-therapy-cream cursor-pointer hover:bg-therapy-forest'}`}
              onClick={e => {
                if (isPast) return;
                e.stopPropagation();
                if (onEditReminder) onEditReminder(reminder);
              }}
            >
              {reminder.title}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-therapy-forest">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-therapy-sage text-therapy-cream rounded-lg
                     hover:bg-therapy-forest transition-colors duration-200"
          >
            Previous
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-therapy-sage text-therapy-cream rounded-lg
                     hover:bg-therapy-forest transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-therapy-forest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {generateCalendarDays()}
      </div>
    </div>
  );
};

export default CalendarView;