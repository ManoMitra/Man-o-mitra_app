
import React from 'react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'calendar', label: 'Your Calendar/ Reminders' },
    { id: 'caregivers', label: 'Your Care Givers' },
    { id: 'locations', label: 'Your Locations' },
    { id: 'device-status', label: 'Device Status' },
  ];

  return (
    <header className="bg-therapy-cream shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-6">
            <img 
              src="/image_2025-07-14_150623606-removebg-preview.png" 
              alt="Mano Mitra Logo" 
              className="h-16 aspect-square object-contain"
            />
            <img 
              src="/Logo Title.png" 
              alt="Mano Mitra Title" 
              className="h-12 object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  currentTab === tab.id
                    ? 'text-therapy-forest bg-therapy-mint/50'
                    : 'text-therapy-forest/70 hover:text-therapy-forest hover:bg-therapy-mint/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;