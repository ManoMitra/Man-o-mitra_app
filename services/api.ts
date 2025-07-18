import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { Reminder, Caregiver, Location } from '../types';

/*
 * =================================================================
 * Firebase Firestore & Storage API Service for Mano Mitra
 * =================================================================
 */

// --- Collection References ---
const remindersCollection = collection(db, 'reminders');
const caregiversCollection = collection(db, 'caregivers');
const locationsCollection = collection(db, 'locations');
const profileDocRef = doc(db, 'profile', 'user_profile');

// --- Helper to convert a Firestore snapshot to a typed object with an ID ---
// Helper function to reconstruct descriptors from Firestore document
const reconstructDescriptors = (doc: any): number[][] => {
  const descriptors: number[][] = [];
  const data = doc.data();
  let index = 0;
  
  while (data[`descriptor_${index}`]) {
    descriptors.push(data[`descriptor_${index}`]);
    index++;
  }
  
  return descriptors;
};

// Update the fromSnapshot helper to handle the new structure
const fromSnapshot = <T>(doc: any): T => {
  const data = doc.data();
  const descriptors = reconstructDescriptors(doc);
  return { 
    ...data, 
    id: doc.id,
    descriptors, // Replace the stored format with the array format
  } as T;
};

// --- Test Firebase Connection ---
export const testFirebaseConnection = async (): Promise<boolean> => {
    try {
        console.log('Testing Firebase connection...');
        
        // Test 1: Just test if Firebase is initialized (no database access)
        console.log('Test 1: Testing Firebase initialization...');
        if (db && storage) {
            console.log('✓ Firebase services initialized successfully');
        } else {
            throw new Error('Firebase services not initialized');
        }
        
        // Test 2: Try a simple read operation (this should work with open rules)
        console.log('Test 2: Testing simple read operation...');
        const testDocRef = doc(db, 'test', 'connection-test');
        const testDoc = await getDoc(testDocRef);
        console.log('✓ Read operation successful (document exists:', testDoc.exists(), ')');
        
        console.log('✓ Firebase connection test passed!');
        return true;
    } catch (error: any) {
        console.error('❌ Firebase connection failed:', error);
        
        // Provide specific error guidance
        if (error.code === 'permission-denied') {
            console.error('This is a permissions issue. Check your Firestore and Storage rules.');
            console.error('Make sure your Firestore rules allow: allow read, write: if true;');
        } else if (error.code === 'unavailable') {
            console.error('Firebase service is unavailable. Check your internet connection.');
        } else if (error.code === 'not-found') {
            console.error('Firebase project not found. Check your project configuration.');
        } else {
            console.error('Unknown error. Please check your Firebase configuration and rules.');
        }
        
        return false;
    }
};

// --- Reminders API ---
export const getReminders = async (): Promise<Reminder[]> => {
    try {
        console.log('Fetching reminders...');
        const snapshot = await getDocs(remindersCollection);
        const reminders = snapshot.docs.map(doc => fromSnapshot<Reminder>(doc));
        console.log('Reminders fetched successfully:', reminders.length);
        return reminders;
    } catch (error) {
        console.error('Error fetching reminders:', error);
        throw new Error(`Failed to fetch reminders: ${error}`);
    }
};

export const addReminder = async (reminderData: Omit<Reminder, 'id'>): Promise<Reminder> => {
    try {
        console.log('Adding reminder:', reminderData);
        // Check for existing reminder with same date, time, and title
        const snapshot = await getDocs(remindersCollection);
        const existing = snapshot.docs.find(doc => {
            const data = doc.data();
            return (
                data.date === reminderData.date &&
                data.time === reminderData.time &&
                data.title === reminderData.title
            );
        });
        if (existing) {
            console.log('Duplicate reminder found, returning existing:', existing.id);
            return fromSnapshot<Reminder>(existing);
        }
        const docRef = await addDoc(remindersCollection, reminderData);
        const newReminder = { ...reminderData, id: docRef.id };
        console.log('Reminder added successfully:', newReminder);
        return newReminder;
    } catch (error) {
        console.error('Error adding reminder:', error);
        throw new Error(`Failed to add reminder: ${error}`);
    }
};

export const updateReminder = async (id: string, reminderData: Partial<Reminder>): Promise<Reminder> => {
    try {
        console.log('Updating reminder:', id, reminderData);
        const docRef = doc(db, 'reminders', id);
        await updateDoc(docRef, reminderData);
        const updatedData = (await getDoc(docRef)).data();
        const updatedReminder = { ...updatedData, id } as Reminder;
        console.log('Reminder updated successfully:', updatedReminder);
        return updatedReminder;
    } catch (error) {
        console.error('Error updating reminder:', error);
        throw new Error(`Failed to update reminder: ${error}`);
    }
};

export const deleteReminder = async (id: string): Promise<void> => {
    try {
        console.log('Deleting reminder:', id);
        const docRef = doc(db, 'reminders', id);
        await deleteDoc(docRef);
        console.log('Reminder deleted successfully');
    } catch (error) {
        console.error('Error deleting reminder:', error);
        throw new Error(`Failed to delete reminder: ${error}`);
    }
};

// --- Caregivers API ---
export const getCaregivers = async (): Promise<Caregiver[]> => {
  try {
    console.log('Fetching caregivers...');
    const snapshot = await getDocs(caregiversCollection);
    const caregivers = snapshot.docs.map(doc => fromSnapshot<Caregiver>(doc));
    console.log('Caregivers fetched successfully:', caregivers.length);
    return caregivers;
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    throw new Error(`Failed to fetch caregivers: ${error}`);
  }
};

export const uploadCaregiverFaceData = async (
  caregiverId: string,
  faceData: { images: string[], descriptors: number[][] }
): Promise<void> => {
  try {
    console.log('Starting caregiver face data upload:', {
      caregiverId,
      imageCount: faceData.images.length,
      descriptorCount: faceData.descriptors.length
    });
    
    // Validate data before upload
    if (!faceData.images || !faceData.descriptors) {
      throw new Error('Missing required face data');
    }

    if (faceData.images.length !== faceData.descriptors.length) {
      throw new Error('Mismatch between images and descriptors count');
    }

    // Upload face descriptors and images directly to Firestore
    const docRef = doc(db, 'caregivers', caregiverId);
    
    // First check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.error('Caregiver document not found:', caregiverId);
      throw new Error('Caregiver not found');
    }

    console.log('Uploading to Firestore...', { path: `caregivers/${caregiverId}` });
    
    // Split the upload into smaller chunks if needed
    const CHUNK_SIZE = 3; // Upload 3 images at a time
    for (let i = 0; i < faceData.images.length; i += CHUNK_SIZE) {
      const imageChunk = faceData.images.slice(i, i + CHUNK_SIZE);
      const descriptorChunk = faceData.descriptors.slice(i, i + CHUNK_SIZE);
      
      // Convert descriptor arrays to objects to avoid nested arrays
      const descriptorObjects = descriptorChunk.map((descriptor, index) => ({
        [`descriptor_${i + index}`]: descriptor
      }));
      
      console.log(`Uploading chunk ${i/CHUNK_SIZE + 1}/${Math.ceil(faceData.images.length/CHUNK_SIZE)}`);
      
      // Create an object for this chunk's update (don't increment photoCount here)
      const updateData: any = {
        [`faceImages_${i/CHUNK_SIZE}`]: imageChunk
      };
      
      // Add descriptor data
      descriptorObjects.forEach((obj, index) => {
        Object.assign(updateData, obj);
      });
      
      await updateDoc(docRef, updateData);
    }
    
    console.log('Face data upload completed successfully');
  } catch (error: any) {
    console.error('Error in uploadCaregiverFaceData:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    if (error.code === 'failed-precondition') {
      throw new Error('Failed to upload. Please make sure the caregiver exists.');
    } else if (error.code === 'resource-exhausted') {
      throw new Error('Upload size too large. Try reducing image quality or taking fewer photos.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore rules.');
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }
};

export const uploadCaregiverDisplayImage = async (caregiverId: string, displayImageBase64: string): Promise<string> => {
  try {
    console.log('Starting display image upload for caregiver:', caregiverId);
    
    // Validate input
    if (!displayImageBase64) {
      throw new Error('No image data provided');
    }

    // Check if caregiver exists first
    const docRef = doc(db, 'caregivers', caregiverId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.error('Caregiver document not found:', caregiverId);
      throw new Error('Caregiver not found');
    }

    console.log('Uploading display image to Firestore...');
    await updateDoc(docRef, {
      displayImage: displayImageBase64
    });
    
    console.log('Display image upload completed successfully');
    return displayImageBase64;
  } catch (error: any) {
    console.error('Error in uploadCaregiverDisplayImage:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    if (error.code === 'resource-exhausted') {
      throw new Error('Image too large. Please try a smaller image or compress it further.');
    } else if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore rules.');
    } else {
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }
  }
};

export const uploadCaregiverImages = async (caregiverId: string, images: string[], descriptors: number[][]): Promise<Caregiver> => {
  try {
    console.log('Starting uploadCaregiverImages:', {
      caregiverId,
      imageCount: images.length,
      descriptorCount: descriptors.length
    });
    
    // Upload face data
    await uploadCaregiverFaceData(caregiverId, { images, descriptors });
    
    // Get updated caregiver data
    const docRef = doc(db, 'caregivers', caregiverId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Caregiver not found');
    }
    
    console.log('Upload completed successfully');
    return fromSnapshot<Caregiver>(docSnap);
  } catch (error: any) {
    console.error('Error in uploadCaregiverImages:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const addCaregiver = async (caregiverData: Omit<Caregiver, 'id'>): Promise<Caregiver> => {
  try {
    console.log('Adding caregiver:', caregiverData);
    const { displayImage, images, descriptors, ...basicData } = caregiverData;
    
    // Calculate total photo count upfront
    const totalPhotoCount = images?.length || 0;
    
    // First create caregiver document with basic info and correct photo count
    const docRef = await addDoc(caregiversCollection, {
      ...basicData,
      photoCount: totalPhotoCount
    });

    // Upload display image if provided
    let displayImageUrl = '';
    if (displayImage) {
      displayImageUrl = await uploadCaregiverDisplayImage(docRef.id, displayImage);
    }

    // Upload face recognition data if provided
    if (images?.length && descriptors?.length) {
      await uploadCaregiverFaceData(docRef.id, { images, descriptors });
    }

    // Update document with display image URL
    await updateDoc(docRef, { displayImageUrl });

    const newCaregiver = {
      ...caregiverData,
      id: docRef.id,
      displayImageUrl,
      photoCount: totalPhotoCount
    };

    console.log('Caregiver added successfully:', newCaregiver);
    return newCaregiver;
  } catch (error) {
    console.error('Error adding caregiver:', error);
    throw new Error(`Failed to add caregiver: ${error}`);
  }
};

export const updateCaregiver = async (id: string, caregiverData: Caregiver): Promise<Caregiver> => {
  try {
    console.log('Updating caregiver:', id, caregiverData);
    const docRef = doc(db, 'caregivers', id);
    const { displayImage, images, descriptors, ...basicData } = caregiverData;

    // Update display image if new one provided
    let displayImageUrl = caregiverData.displayImageUrl;
    if (displayImage && displayImage !== displayImageUrl) {
      displayImageUrl = await uploadCaregiverDisplayImage(id, displayImage);
    }

    // Update face recognition data if provided
    if (images?.length && descriptors?.length) {
      await uploadCaregiverFaceData(id, { images, descriptors });
    }

    // Update document with basic info and display image URL
    await updateDoc(docRef, {
      ...basicData,
      displayImageUrl
    });

    const updatedCaregiver = {
      ...caregiverData,
      displayImageUrl
    };

    console.log('Caregiver updated successfully');
    return updatedCaregiver;
  } catch (error) {
    console.error('Error updating caregiver:', error);
    throw new Error(`Failed to update caregiver: ${error}`);
  }
};

export const deleteCaregiver = async (id: string): Promise<void> => {
  try {
    console.log('Deleting caregiver:', id);
    
    // Delete all storage files
    try {
      const displayImageRef = ref(storage, `caregivers/${id}/display_image`);
      await deleteObject(displayImageRef);
      
      // Delete face recognition folder
      const faceRecognitionRef = ref(storage, `caregivers/${id}/face_recognition`);
      await deleteObject(faceRecognitionRef);
    } catch (error) {
      console.warn('Some storage files might not exist:', error);
    }

    // Delete Firestore document
    const docRef = doc(db, 'caregivers', id);
    await deleteDoc(docRef);
    
    console.log('Caregiver deleted successfully');
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    throw new Error(`Failed to delete caregiver: ${error}`);
  }
};

// --- Profile / Primary Caregiver API ---
export const getPrimaryCaregiverId = async (): Promise<string | null> => {
    try {
        console.log('Fetching primary caregiver ID...');
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
            const primaryId = docSnap.data().primaryCaregiverId || null;
            console.log('Primary caregiver ID found:', primaryId);
            return primaryId;
        }
        console.log('No primary caregiver profile found, checking caregivers...');
        const caregivers = await getCaregivers();
        if (caregivers.length > 0) {
            await savePrimaryCaregiverId(caregivers[0].id);
            console.log('Set first caregiver as primary:', caregivers[0].id);
            return caregivers[0].id;
        }
        console.log('No caregivers found');
        return null;
    } catch (error) {
        console.error('Error fetching primary caregiver ID:', error);
        throw new Error(`Failed to fetch primary caregiver ID: ${error}`);
    }
};

export const savePrimaryCaregiverId = async (id: string | null): Promise<void> => {
    try {
        console.log('Saving primary caregiver ID:', id);
        await setDoc(profileDocRef, { primaryCaregiverId: id });
        console.log('Primary caregiver ID saved successfully');
    } catch (error) {
        console.error('Error saving primary caregiver ID:', error);
        throw new Error(`Failed to save primary caregiver ID: ${error}`);
    }
};

// --- Locations API ---
export const getLocations = async (): Promise<Location[]> => {
    try {
        console.log('Fetching locations...');
        const snapshot = await getDocs(locationsCollection);
        const locations = snapshot.docs.map(doc => fromSnapshot<Location>(doc));
        console.log('Locations fetched successfully:', locations.length);
        return locations;
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw new Error(`Failed to fetch locations: ${error}`);
    }
};

export const addLocation = async (locationData: Omit<Location, 'id'>): Promise<Location> => {
    try {
        console.log('Adding location:', locationData);
        const docRef = await addDoc(locationsCollection, locationData);
        const newLocation = { ...locationData, id: docRef.id };
        console.log('Location added successfully:', newLocation);
        return newLocation;
    } catch (error) {
        console.error('Error adding location:', error);
        throw new Error(`Failed to add location: ${error}`);
    }
};

export const updateLocation = async (id: string, locationData: Partial<Location>): Promise<Location> => {
    try {
        console.log('Updating location:', id, locationData);
        const docRef = doc(db, 'locations', id);
        await updateDoc(docRef, locationData);
        const updatedData = (await getDoc(docRef)).data();
        const updatedLocation = { ...updatedData, id } as Location;
        console.log('Location updated successfully:', updatedLocation);
        return updatedLocation;
    } catch (error) {
        console.error('Error updating location:', error);
        throw new Error(`Failed to update location: ${error}`);
    }
};

export const deleteLocation = async (id: string): Promise<void> => {
    try {
        console.log('Deleting location:', id);
        const docRef = doc(db, 'locations', id);
        await deleteDoc(docRef);
        console.log('Location deleted successfully');
    } catch (error) {
        console.error('Error deleting location:', error);
        throw new Error(`Failed to delete location: ${error}`);
    }
};