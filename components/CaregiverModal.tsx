import React, { useState, useRef } from 'react';
import { Caregiver } from '../types';
import { CloseIcon, TrashIcon, CameraIcon, UserIcon } from './Icons';
import FaceRecognition from './FaceRecognition';
import { compressImage } from './FaceRecognition';  // Import the compression function

interface CaregiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caregiver: Omit<Caregiver, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  initialData: Caregiver | null;
}

const CaregiverModal: React.FC<CaregiverModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const [displayImage, setDisplayImage] = useState<string>('');
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialData;

  React.useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setRelation(initialData.relation);
      setContact(initialData.contact);
      setImages(initialData.images || []);
      setDescriptors(initialData.descriptors || []);
      setDisplayImage(initialData.displayImage || '');
    } else if (isOpen) {
      setName('');
      setRelation('');
      setContact('');
      setImages([]);
      setDescriptors([]);
      setDisplayImage('');
    }
  }, [initialData, isOpen]);

  const handleDisplayImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result as string;
          const compressed = await compressImage(base64Image);
          setDisplayImage(compressed);
          setIsCompressing(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to compress image:', error);
        alert('Failed to process image. Please try a different photo.');
        setIsCompressing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !relation || !contact || (!isEditing && descriptors.length === 0)) {
      alert("Please fill all fields" + (!isEditing ? " and complete face recognition setup." : "."));
      return;
    }

    if (isSaving) return; // Prevent double submission

    setIsSaving(true);
    try {
      const caregiverData: any = {
        ...initialData,
        name,
        relation,
        contact,
        images,
        descriptors, // Save as array of arrays
        displayImage,
        displayImageUrl: initialData?.displayImageUrl || '',
        photoCount: images.length,
      };
      if (isEditing && initialData?.id) {
        caregiverData.id = initialData.id;
      }

      await onSave(caregiverData);
    } catch (error) {
      console.error('Error saving caregiver:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (initialData) onDelete(initialData.id);
  };

  const handleFaceCaptureComplete = (capturedImages: string[], capturedDescriptors: number[][]) => {
    setImages(capturedImages);
    setDescriptors(capturedDescriptors);
    setShowFaceCapture(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Caregiver' : 'Add Caregiver'}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-4 space-y-4">
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Display"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isCompressing ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <CameraIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDisplayImageChange}
                  disabled={isCompressing}
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="relation" className="block text-sm font-medium text-gray-700">Relation</label>
              <input
                type="text"
                id="relation"
                value={relation}
                onChange={e => setRelation(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact</label>
              <input
                type="tel"
                id="contact"
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Face Recognition Setup</label>
              <button
                onClick={() => setShowFaceCapture(true)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                type="button"
              >
                {descriptors.length > 0 ? 'Redo Face Recognition' : 'Start Face Recognition'}
              </button>
              {descriptors.length > 0 && (
                <p className="text-sm text-green-600">✓ Face recognition completed ({descriptors.length} photos)</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
            {isEditing ? (
              <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors">
                <TrashIcon className="w-5 h-5"/>
              </button>
            ) : <div></div>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  isEditing ? 'Save Changes' : 'Add Caregiver'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFaceCapture && (
        <FaceRecognition
          onComplete={handleFaceCaptureComplete}
          onCancel={() => setShowFaceCapture(false)}
        />
      )}
    </>
  );
};

export default CaregiverModal;
