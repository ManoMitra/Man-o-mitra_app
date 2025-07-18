
import React from 'react';
import { Location } from '../types';
import { PlusIcon, PencilIcon, MapPinIcon } from './Icons';
import MapView from './MapView';

interface LocationsViewProps {
  locations: Location[];
  onAdd: () => void;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  homeLocation: Location | undefined;
}

const LocationsView: React.FC<LocationsViewProps> = ({ locations, onAdd, onEdit, homeLocation }) => {
  const mapCenter: [number, number] = homeLocation ? [homeLocation.lat, homeLocation.lng] : [28.6139, 77.2090]; // New Delhi

  return (
    <div className="bg-therapy-cream rounded-xl shadow-lg p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-therapy-forest">Your Locations</h2>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="h-[400px] w-full bg-therapy-mint/10 rounded-lg overflow-hidden shadow-inner relative">
         <MapView locations={locations} center={mapCenter} zoom={11} homeLocation={homeLocation} />
      </div>

      {locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {locations.map(location => (
            <div key={location.id} className="rounded-lg p-4 border bg-therapy-cream border-therapy-sage flex flex-col justify-between transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                    <div className="mt-1 text-blue-500 shrink-0">
                        <MapPinIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-therapy-forest">{location.name}</h3>
                        <p className="text-sm text-therapy-forest/70">{location.address}</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => onEdit(location)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-therapy-forest bg-therapy-cream border border-therapy-sage rounded-md shadow-sm hover:bg-therapy-mint/30"
                        aria-label={`Edit ${location.name}`}
                    >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-therapy-sage rounded-lg bg-therapy-cream">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400"/>
            <h3 className="mt-2 text-sm font-medium text-therapy-forest">No locations saved</h3>
            <p className="mt-1 text-sm text-therapy-forest/70">Get started by adding a new location.</p>
        </div>
      )}
    </div>
  );
};

export default LocationsView;
