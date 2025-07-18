import React, { useState } from 'react';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Reminder {
  id?: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  location?: Location;
}

interface TimedLocationReminder extends Reminder {
  type: 'timed-location';
  maxTime: string;
  location: Location;
}

interface DefaultReminder extends Reminder {
  type: 'default';
}

interface ReminderModalProps {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
  onDelete?: (id: string) => void;
  initialData?: Reminder;
  locations: Location[];
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  date,
  onClose,
  onSave,
  onDelete,
  initialData,
  locations = []
}) => {
  const [reminderType, setReminderType] = useState<'default' | 'timed-location'>(initialData && (initialData as any).type ? (initialData as any).type : 'default');
  const [reminder, setReminder] = useState<Reminder | TimedLocationReminder | DefaultReminder>(
    initialData
      ? initialData
      : {
          title: '',
          date: date,
          time: '12:00',
          description: '',
          type: 'default',
        }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(reminder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-therapy-cream rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-therapy-forest mb-4">
          {initialData ? 'Edit Reminder' : 'New Reminder'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-therapy-forest mb-1">Reminder Type</label>
            <select
              value={reminderType}
              onChange={e => {
                const type = e.target.value as 'default' | 'timed-location';
                setReminderType(type);
                setReminder(r => {
                  if (type === 'timed-location') {
                    return {
                      ...r,
                      type,
                      maxTime: '',
                      location: locations[0] || { id: '', name: '', address: '' },
                    } as TimedLocationReminder;
                  } else {
                    // Remove location and maxTime for default
                    const { location, maxTime, ...rest } = r as any;
                    return {
                      ...rest,
                      type: 'default',
                    } as DefaultReminder;
                  }
                });
              }}
              className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
            >
              <option value="default">Default Reminder</option>
              <option value="timed-location">Timed Location Reminder</option>
            </select>
          </div>
          {/* Title */}
          <div>
            <label className="block text-therapy-forest mb-1">Title</label>
            <input
              type="text"
              value={reminder.title}
              onChange={e => setReminder({ ...reminder, title: e.target.value })}
              className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
              required
            />
          </div>
          {/* Time */}
          <div>
            <label className="block text-therapy-forest mb-1">Time</label>
            <input
              type="time"
              value={reminder.time}
              onChange={e => setReminder({ ...reminder, time: e.target.value })}
              className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
              required
            />
          </div>
          {/* Timed Location Reminder fields */}
          {reminderType === 'timed-location' && (
            <>
              <div>
                <label className="block text-therapy-forest mb-1">Location</label>
                <select
                  value={(reminder as TimedLocationReminder).location?.id || ''}
                  onChange={e => {
                    const location = locations.find(loc => loc.id === e.target.value);
                    setReminder(r => ({
                      ...(r as TimedLocationReminder),
                      location: location || { id: '', name: '', address: '' },
                    }));
                  }}
                  className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-therapy-forest mb-1">Maximum Time</label>
                <input
                  type="text"
                  value={(reminder as TimedLocationReminder).maxTime || ''}
                  onChange={e => setReminder(r => ({
                    ...(r as TimedLocationReminder),
                    maxTime: e.target.value,
                  }))}
                  className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
                  required
                />
                <p className="text-xs text-therapy-forest/70 mt-1">This is the max time after which you will be asked if assistance is needed.</p>
              </div>
            </>
          )}
          {/* Description */}
          <div>
            <label className="block text-therapy-forest mb-1">Description</label>
            <textarea
              value={reminder.description}
              onChange={e => setReminder({ ...reminder, description: e.target.value })}
              className="w-full p-2 border border-therapy-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-therapy-sage"
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <div className="space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-therapy-sage text-therapy-cream rounded-lg hover:bg-therapy-forest transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-therapy-sage text-therapy-sage rounded-lg hover:bg-therapy-sage hover:text-therapy-cream transition-colors"
              >
                Cancel
              </button>
            </div>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (initialData.id) {
                    onDelete(initialData.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;