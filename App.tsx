    
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AuthPage from './components/AuthPage';
import FeatureBlock from './components/FeatureBlock';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import CaregiversView from './components/CaregiversView';
import LocationsView from './components/LocationsView';
import DeviceStatusView from './components/DeviceStatusView';
import FaceRecognition from './components/FaceRecognition';
import FloatingActionButtons from './components/FloatingActionButtons';
import ReminderTestPanel from './components/ReminderTestPanel';
import ReminderModal from './components/ReminderModal';
import CaregiverModal from './components/CaregiverModal';
import LocationModal from './components/LocationModal';
import { Reminder, Caregiver, Location } from './types';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { addCaregiver, updateCaregiver, uploadCaregiverImages, getCaregivers as fetchCaregiversApi } from './services/api';
import 'leaflet/dist/leaflet.css';

const features = [
  {
    title: 'Face Recognition',
    description: 'Advanced AI-powered face recognition for secure and reliable identification.',
    icon: '👤',
    route: 'face-recognition'
  },
  {
    title: 'Medication Reminders',
    description: 'Smart reminders to ensure medications are taken on time, every time.',
    icon: '💊',
    route: 'calendar'
  },
  {
    title: 'Location Tracking',
    description: 'Real-time location monitoring for peace of mind and safety.',
    icon: '📍',
    route: 'locations'
  },
  {
    title: 'Caregiver Support',
    description: 'Connect with qualified caregivers and manage care schedules effortlessly.',
    icon: '🤝',
    route: 'caregivers'
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Set to false by default
  const [showLanding, setShowLanding] = useState(true); // Show landing page after login/signup
  const [currentTab, setCurrentTab] = useState('calendar');
  const [showAuthPage, setShowAuthPage] = useState(false);  // Set to false by default

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      date: '2025-07-18',
      time: '09:00',
      title: 'Take Morning Pills',
      description: 'Take the blue pills and green pill along with water',
      reminderType: 'standard',
    },
    {
      id: '2',
      date: '2025-07-14',
      time: '18:00',
      title: 'take your evening medication',
      description: 'Take the white pills with dinner and don\'t forget to check your blood pressure',
      reminderType: 'standard',
    },
    {
      id: '3',
      date: '2025-07-18',
      time: '13:00',
      title: 'have your lunch',
      description: 'Don\'t forget to take your diabetes medication with your meal',
      reminderType: 'standard',
    },
  ]);

  // Modal state
  const [showReminderTestPanel, setShowReminderTestPanel] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderModalDate, setReminderModalDate] = useState(new Date());
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Add a guard to prevent modal from reopening after delete/cancel
  const [modalJustClosed, setModalJustClosed] = useState(false);

  // Add a key to force modal remount and clear fields for new reminders only
  const [modalKey, setModalKey] = useState(0);

  // Add Reminder handler
  const handleAddReminder = (reminder: any) => {
    setReminders(prev => [
      ...prev,
      {
        ...reminder,
        id: Math.random().toString(36).substr(2, 9),
        date: reminder.date instanceof Date ? reminder.date.toISOString().slice(0, 10) : reminder.date,
        reminderType: 'standard',
      },
    ]);
    setShowReminderModal(false);
    setEditingReminder(null);
  };

  // Edit Reminder handler
  const handleEditReminder = (reminder: Reminder) => {
    let dateObj: Date;
    if (typeof reminder.date === 'string') {
      dateObj = new Date(reminder.date + 'T00:00:00');
    } else {
      dateObj = reminder.date;
    }
    setEditingReminder({ ...reminder, date: dateObj.toISOString().slice(0, 10) }); // Always store as string
    setReminderModalDate(dateObj);
    setShowReminderModal(true);
  };

  // Open Add Reminder modal for a specific date
  const handleOpenAddReminder = (date: Date) => {
    setEditingReminder(null);
    setReminderModalDate(date);
    setModalKey(k => k + 1); // Only increment key for new reminder
    setShowReminderModal(true);
  };

  // Close modal and clear state
  const handleCloseModal = () => {
    setShowReminderModal(false);
    setEditingReminder(null);
    setReminderModalDate(new Date());
    setModalJustClosed(true);
    setTimeout(() => setModalJustClosed(false), 300); // Reset guard after short delay
  };

  // Remove Reminder handler
  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    handleCloseModal();
  };

  // Helper to format date as YYYY-MM-DD in local time
  function formatLocalDate(date: Date): string {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  // Save Reminder (edit or add)
  const handleSaveReminder = (reminder: any) => {
    let dateString;
    if (editingReminder) {
      dateString = reminder.date instanceof Date ? formatLocalDate(reminder.date) : reminder.date;
    } else {
      dateString = formatLocalDate(reminderModalDate); // Always use modal date for new reminders
    }
    if (editingReminder) {
      setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...reminder, id: editingReminder.id, date: dateString, reminderType: 'standard' } : r));
    } else {
      setReminders(prev => [
        ...prev,
        {
          ...reminder,
          id: Math.random().toString(36).substr(2, 9),
          date: dateString,
          reminderType: 'standard',
        },
      ]);
    }
    handleCloseModal();
  };

  // FAB handlers
  const handleMicClick = () => setShowReminderTestPanel(true);
  const handlePlusClick = () => {
    setReminderModalDate(new Date());
    setShowReminderModal(true);
  };

  // CalendarView handler for day click (to add reminder for that day)
  // You can extend CalendarView to accept an onAddReminder prop if needed

  // Function to render the current view based on the selected tab
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'calendar':
        return <CalendarView
          reminders={reminders.map(r => ({
            ...r,
            date: new Date(r.date)
          }))}
          onAddReminder={handleOpenAddReminder}
          onEditReminder={handleEditReminder as any}
        />;
      case 'caregivers':
        return <CaregiversView 
          caregivers={caregivers} 
          primaryCaregiverId={primaryCaregiverId} 
          onAdd={handleAddCaregiver} 
          onEdit={handleEditCaregiver} 
          onSetPrimary={() => {}} 
          onUploadPhotos={handleUploadCaregiverPhotos} 
          uploadingId={null} 
        />;
      case 'locations':
        return <LocationsView 
          locations={[]}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          homeLocation={undefined}
        />;
      case 'device-status':
        return <DeviceStatusView 
          caregivers={caregivers}
          homeLocation={undefined}
        />;
      case 'face-recognition':
        return <FaceRecognition 
          onComplete={() => {}}
          onCancel={() => {}}
        />;
      default:
        return <CalendarView />;
    }
  };

  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [primaryCaregiverId, setPrimaryCaregiverId] = useState<string>('');
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);

  const fetchCaregivers = async () => {
    const caregiversList = await fetchCaregiversApi();
    setCaregivers(caregiversList);
    if (caregiversList.length > 0) setPrimaryCaregiverId(caregiversList[0].id);
  };

  useEffect(() => { fetchCaregivers(); }, []);

  const handleAddCaregiver = () => {
    setEditingCaregiver(null);
    setShowCaregiverModal(true);
  };

  const handleEditCaregiver = (caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
    setShowCaregiverModal(true);
  };

  const handleSaveCaregiver = async (caregiver: Omit<Caregiver, 'id'> & { id?: string }) => {
    if (caregiver.id) {
      // Update existing using API
      await updateCaregiver(caregiver.id, caregiver as Caregiver);
    } else {
      // Add new using API
      await addCaregiver(caregiver as Omit<Caregiver, 'id'>);
    }
    setShowCaregiverModal(false);
    setEditingCaregiver(null);
    await fetchCaregivers();
  };

  const handleDeleteCaregiver = async (id: string) => {
    await deleteDoc(doc(db, 'caregivers', id));
    setShowCaregiverModal(false);
    setEditingCaregiver(null);
    await fetchCaregivers();
  };

  const handleUploadCaregiverPhotos = async (caregiverId: string, images: string[], descriptors: number[][]) => {
    await uploadCaregiverImages(caregiverId, images, descriptors);
    await fetchCaregivers();
  };

  const [locations, setLocations] = useState<Location[]>([]);
  const [homeLocation, setHomeLocation] = useState<Location | undefined>(undefined);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const fetchLocations = async () => {
    const locationsCol = collection(db, 'locations');
    const locationsSnapshot = await getDocs(locationsCol);
    const locationsList = locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
    setLocations(locationsList);
    if (locationsList.length > 0) setHomeLocation(locationsList[0]);
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (location: Omit<Location, 'id'> & { id?: string }) => {
    if (location.id) {
      // Update existing
      await setDoc(doc(db, 'locations', location.id), location);
    } else {
      // Add new
      await addDoc(collection(db, 'locations'), location);
    }
    setShowLocationModal(false);
    setEditingLocation(null);
    await fetchLocations();
  };

  const handleDeleteLocation = async (id: string) => {
    await deleteDoc(doc(db, 'locations', id));
    setShowLocationModal(false);
    setEditingLocation(null);
    await fetchLocations();
  };

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => {
      setIsAuthenticated(true);
      setShowLanding(true);
    }} />;
  }

  if (showLanding) {
    const quickAccess = [
      {
        icon: '💊',
        title: 'Reminders',
        description: 'View and manage your medication reminders.',
        tab: 'calendar',
      },
      {
        icon: '🤝',
        title: 'Caregivers',
        description: 'See and manage your caregivers.',
        tab: 'caregivers',
      },
      {
        icon: '📍',
        title: 'Locations',
        description: 'Track and manage important locations.',
        tab: 'locations',
      },
      {
        icon: '🖥️',
        title: 'Device Status',
        description: 'Check your device and recognition status.',
        tab: 'device-status',
      },
    ];
    return (
      <div className="min-h-screen bg-therapy-cream text-therapy-forest">
        <div className="flex flex-col min-h-screen">
          <Header currentTab={currentTab} onTabChange={setCurrentTab} />
          <main className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full px-6 py-16 bg-therapy-mint/30 rounded-3xl shadow-xl flex flex-col items-center">
              <img src="/Logo Title.png" alt="ManoMitra Logo" className="h-24 mb-6" />
              <h1 className="text-5xl font-extrabold mb-4 text-therapy-forest text-center">Welcome to ManoMitra</h1>
              <p className="text-xl text-therapy-forest/80 mb-8 text-center">Your trusted companion in elderly care, bringing peace of mind to families through innovative technology.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl mb-8">
                {quickAccess.map((q, i) => (
                  <button
                    key={q.tab}
                    className="card flex flex-col items-center justify-center py-8 px-4 bg-therapy-cream hover:bg-therapy-mint/40 transition rounded-xl shadow-lg text-center focus:outline-none focus:ring-2 focus:ring-therapy-sage"
                    onClick={() => { setShowLanding(false); setCurrentTab(q.tab); }}
                  >
                    <span className="text-4xl mb-2">{q.icon}</span>
                    <span className="text-lg font-bold mb-1">{q.title}</span>
                    <span className="text-therapy-forest/70 text-sm">{q.description}</span>
                  </button>
                ))}
              </div>
              <button
                className="btn-primary text-lg px-8 py-4 rounded-full font-semibold shadow-lg"
                onClick={() => setShowLanding(false)}
              >
                Enter App
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-therapy-cream">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="container mx-auto px-4 py-8">
        {currentTab === 'calendar' && (
          <CalendarView
            reminders={reminders.map(r => ({
              ...r,
              date: new Date(r.date)
            }))}
            onAddReminder={handleOpenAddReminder}
            onEditReminder={handleEditReminder as any}
          />
        )}
        {currentTab === 'caregivers' && (
          <CaregiversView
            caregivers={caregivers}
            primaryCaregiverId={primaryCaregiverId}
            onAdd={handleAddCaregiver}
            onEdit={handleEditCaregiver}
            onSetPrimary={setPrimaryCaregiverId}
            onUploadPhotos={handleUploadCaregiverPhotos}
            uploadingId={null}
          />
        )}
        {currentTab === 'locations' && (
          <LocationsView
            locations={locations}
            onAdd={handleAddLocation}
            onEdit={handleEditLocation}
            onDelete={handleDeleteLocation}
            homeLocation={homeLocation}
          />
        )}
        {currentTab === 'device-status' && (
          <DeviceStatusView
            caregivers={caregivers}
            homeLocation={homeLocation}
          />
        )}
        {/* ... other views ... */}
      </main>
      {currentTab === 'calendar' && (
        <FloatingActionButtons onMicClick={handleMicClick} onPlusClick={() => handleOpenAddReminder(new Date())} />
      )}
      <ReminderTestPanel reminders={reminders} isOpen={showReminderTestPanel} onClose={() => setShowReminderTestPanel(false)} />
      <ReminderModal
        key={editingReminder ? undefined : modalKey}
        isOpen={showReminderModal}
        date={reminderModalDate}
        onClose={handleCloseModal}
        onSave={handleSaveReminder}
        onDelete={handleDeleteReminder}
        initialData={editingReminder ? { ...editingReminder, date: typeof editingReminder.date === 'string' ? new Date(editingReminder.date) : editingReminder.date } : undefined}
        locations={[]}
      />
      <CaregiverModal
        isOpen={showCaregiverModal}
        onClose={() => { setShowCaregiverModal(false); setEditingCaregiver(null); }}
        onSave={handleSaveCaregiver}
        onDelete={handleDeleteCaregiver}
        initialData={editingCaregiver}
      />
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => { setShowLocationModal(false); setEditingLocation(null); }}
        onSave={handleSaveLocation}
        onDelete={handleDeleteLocation}
        initialData={editingLocation}
        homeLocation={homeLocation}
      />
    </div>
  );
}