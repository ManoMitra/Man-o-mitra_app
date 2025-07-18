
import React, { useState, useEffect, useCallback } from 'react';
import { Location } from '../types';
import { CloseIcon, TrashIcon } from './Icons';
import LocationPickerMap from './LocationPickerMap';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Omit<Location, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  initialData: Location | null;
  homeLocation: Location | undefined;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, homeLocation }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const isEditing = !!initialData;
  
  const defaultCenter: [number, number] = homeLocation 
    ? [homeLocation.lat, homeLocation.lng] 
    : [28.6139, 77.2090]; // Fallback to New Delhi

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setName(initialData.name);
            setAddress(initialData.address);
            setCoords({ lat: initialData.lat, lng: initialData.lng });
        } else {
            setName('');
            setAddress('');
            setCoords(null);
        }
        setIsGeocoding(false);
    }
  }, [initialData, isOpen]);
  
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setAddress('Finding address...');
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        if (!response.ok) throw new Error('Failed to fetch address');
        const data = await response.json();
        setAddress(data.display_name || 'Could not find address');
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        setAddress('Could not find address. Please enter manually.');
    } finally {
        setIsGeocoding(false);
    }
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);


  const handleSave = () => {
    if (!name || !address || !coords || isGeocoding) return;
    const locationData = {
        id: initialData?.id,
        name,
        address,
        lat: coords.lat,
        lng: coords.lng,
    };
    onSave(locationData);
  };
  
  const handleDelete = () => {
    if (initialData) {
      onDelete(initialData.id);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex justify-center items-center p-4" role="dialog" aria-modal="true">
      {/* Modal is now wider (max-w-4xl) and uses flex-col to manage height */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-6">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Location' : 'Add Location'}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        
        {/* Changed layout to vertical flex, with map taking up most of the space */}
        <div className="px-6 pb-4 flex-grow flex flex-col gap-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="loc-name" className="block text-sm font-medium text-gray-700">Location Name</label>
                    <input type="text" id="loc-name" placeholder="e.g., Home" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="loc-address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" id="loc-address" placeholder={isGeocoding ? 'Finding address...' : "Click map or type address"} value={address} onChange={e => setAddress(e.target.value)} disabled={isGeocoding} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                </div>
            </div>
             <div className="flex-grow min-h-[400px] w-full bg-gray-200 rounded-lg overflow-hidden shadow-inner relative">
                <LocationPickerMap 
                    center={coords ? [coords.lat, coords.lng] : defaultCenter}
                    zoom={coords ? 15 : 12}
                    markerCoords={coords}
                    onMapClick={handleMapClick}
                    homeCoords={homeLocation ? { lat: homeLocation.lat, lng: homeLocation.lng } : null}
                />
                {!coords && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 text-white text-lg font-semibold pointer-events-none">
                        Click on the map to select a location
                    </div>
                )}
            </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center mt-auto">
          {isEditing ? (
            <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors">
              <TrashIcon className="w-5 h-5"/>
            </button>
          ) : <div></div>}
          <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={!name || !address || !coords || isGeocoding} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {isEditing ? 'Save Changes' : 'Add Location'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
