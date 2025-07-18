import React, { useState } from 'react';
import { Caregiver } from '../types';
import { UserPlusIcon, StarIcon, CameraIcon, PencilIcon } from './Icons';
import FaceRecognition from './FaceRecognition';

interface CaregiversViewProps {
  caregivers?: Caregiver[];  // Make caregivers optional
  primaryCaregiverId: string | null;
  onAdd: () => void;
  onEdit: (caregiver: Caregiver) => void;
  onSetPrimary: (id: string) => void;
  onUploadPhotos: (caregiverId: string, images: string[], descriptors: number[][]) => Promise<void>;
  uploadingId: string | null;
}

const CaregiversView: React.FC<CaregiversViewProps> = ({
  caregivers = [],  // Add default empty array
  primaryCaregiverId,
  onAdd,
  onEdit,
  onSetPrimary,
  onUploadPhotos,
  uploadingId
}) => {
  const [targetCaregiverId, setTargetCaregiverId] = useState<string | null>(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);

  const handleAddPhotosClick = (caregiverId: string) => {
    setTargetCaregiverId(caregiverId);
    setShowFaceCapture(true);
  };

  const handleFaceCaptureComplete = async (images: string[], descriptors: number[][]) => {
    if (!targetCaregiverId) return;
    
    try {
      await onUploadPhotos(targetCaregiverId, images, descriptors);
      setShowFaceCapture(false);
      setTargetCaregiverId(null);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      alert('Failed to upload photos. Please try again.');
    }
  };

  return (
    <div className="bg-therapy-cream rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-therapy-forest">Your Care Givers</h2>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>Add Caregiver</span>
        </button>
      </div>

      {caregivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {caregivers.map(caregiver => {
            const isPrimary = caregiver.id === primaryCaregiverId;
            const isUploading = uploadingId === caregiver.id;
            const photoCount = caregiver.photoCount || 0;

            return (
              <div key={caregiver.id} className={`rounded-lg p-4 border flex flex-col justify-between transition-shadow hover:shadow-md 
                ${isPrimary ? 'bg-therapy-mint/10 border-therapy-sage' : 'bg-therapy-cream border-therapy-cream'} 
                ${isPrimary ? 'ring-2 ring-therapy-sage' : ''}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl font-bold shrink-0 overflow-hidden">
                        {caregiver.displayImageUrl ? (
                          <img
                            src={caregiver.displayImageUrl}
                            alt={caregiver.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          caregiver.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-therapy-forest">{caregiver.name}</h3>
                        <p className="text-sm text-gray-600">{caregiver.relation}</p>
                        <p className="text-sm text-gray-500 font-mono">{caregiver.contact}</p>
                      </div>
                    </div>
                    {isPrimary && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0 border border-green-300">
                        <StarIcon className="w-4 h-4" />
                        <span>Primary</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleAddPhotosClick(caregiver.id)}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-therapy-forest bg-therapy-cream border border-therapy-sage rounded-md shadow-sm hover:bg-therapy-mint/30 disabled:bg-gray-200 disabled:cursor-wait"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <CameraIcon className="w-5 h-5" />
                        <span>{photoCount > 0 ? `Add More Photos (${photoCount} saved)` : 'Add photos for facial recognition'}</span>
                      </>
                    )}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetPrimary(caregiver.id)}
                      disabled={isPrimary}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md shadow-sm 
                        ${isPrimary ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-therapy-sage text-therapy-cream hover:bg-therapy-forest'}`}
                    >
                      <StarIcon className="w-4 h-4" />
                      Set as Primary
                    </button>
                    <button
                      onClick={() => onEdit(caregiver)}
                      className="p-2 text-therapy-forest bg-therapy-cream border border-therapy-sage rounded-md shadow-sm hover:bg-therapy-mint/30"
                      aria-label={`Edit ${caregiver.name}`}
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-therapy-sage rounded-lg bg-therapy-cream">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-5M3 4v5H8m13 0v5h-5M3 20v-5h5" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-therapy-forest">No caregivers</h3>
          <p className="mt-1 text-sm text-therapy-forest/70">Get started by adding a new caregiver.</p>
        </div>
      )}

      {showFaceCapture && targetCaregiverId && (
        <FaceRecognition
          onComplete={handleFaceCaptureComplete}
          onCancel={() => {
            setShowFaceCapture(false);
            setTargetCaregiverId(null);
          }}
        />
      )}
    </div>
  );
};

export default CaregiversView;
