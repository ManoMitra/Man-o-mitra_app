import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase project configuration.
// If the current project doesn't work, create a new one and replace these values
const firebaseConfig = {
  apiKey: "AIzaSyCwdBZdDxEdaoIJPETavn2DfoF8jh5GxXc",
  authDomain: "manomitra-c16c3.firebaseapp.com",
  projectId: "manomitra-c16c3",
  storageBucket: "manomitra-c16c3.appspot.com",
  messagingSenderId: "207596710447",
  appId: "1:207596710447:web:2d7832013e78410ff534da",
  measurementId: "G-TRSRXERG5S"
};

// Alternative config for a new project (uncomment and replace if needed):
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

// Validate Firebase config
console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
let app;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
  
  // Initialize Firebase Storage
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
  
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

export { db, storage };