import React, { useState } from 'react';
import FaceRecognition from './FaceRecognition';
import { getFirestore, setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import '../firebaseConfig';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const tabStyle = (active: boolean) => ({
  padding: '10px 24px',
  borderRadius: 999,
  border: 'none',
  background: active ? '#2563eb' : '#f1f5f9',
  color: active ? '#fff' : '#222',
  fontWeight: 600,
  margin: '0 4px',
  cursor: active ? 'default' : 'pointer',
  boxShadow: active ? '0 2px 8px #2563eb33' : undefined,
  transition: 'background 0.2s, color 0.2s',
});

const inputStyle = {
  width: '100%',
  padding: '12px',
  margin: '8px 0',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border 0.2s',
};

const inputFocusStyle = {
  border: '1.5px solid #2563eb',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  marginTop: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #2563eb33',
  transition: 'background 0.2s',
};

const cardStyle = {
  maxWidth: 400,
  margin: '40px auto',
  padding: 32,
  background: '#fff',
  borderRadius: 18,
  boxShadow: '0 4px 32px #0001',
  position: 'relative' as const,
};

const sectionTitleStyle = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 18,
  color: '#2563eb',
  textAlign: 'center' as const,
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<'caregiver' | 'caretaker'>('caretaker');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const [faceDescriptors, setFaceDescriptors] = useState<number[][]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [focus, setFocus] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFaceComplete = (images: string[], descriptors: number[][]) => {
    setFaceImages(images);
    setFaceDescriptors(descriptors);
    setShowFaceModal(false);
    setFeedback({ type: 'success', message: 'Face images captured successfully!' });
  };

  const handleFaceCancel = () => {
    setShowFaceModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    const db = getFirestore();
    try {
      if (mode === 'signup') {
        if (form.password !== form.confirmPassword) {
          setFeedback({ type: 'error', message: 'Passwords do not match.' });
          setLoading(false);
          return;
        }
        if (userType === 'caregiver' && faceImages.length === 0) {
          setShowFaceModal(true);
          setFeedback({ type: 'error', message: 'Please complete facial recognition.' });
          setLoading(false);
          return;
        }
        // Check if user exists
        const q = query(collection(db, 'users'), where('email', '==', form.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setFeedback({ type: 'error', message: 'Email already in use.' });
          setLoading(false);
          return;
        }
        // Create user doc with plain text password
        const userId = crypto.randomUUID();
        await setDoc(doc(db, 'users', userId), {
          userType,
          firstName: form.firstName,
          lastName: form.lastName,
          contact: form.contact,
          email: form.email,
          password: form.password, // plain text
          faceImages: userType === 'caregiver' ? faceImages : [],
          faceDescriptors: userType === 'caregiver' ? faceDescriptors.map(d => ({ values: d })) : [],
        });
        setFeedback({ type: 'success', message: 'Signup successful! Logging you in...' });
        onAuthSuccess();
      } else {
        // Login
        const q = query(collection(db, 'users'), where('email', '==', form.email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setFeedback({ type: 'error', message: 'No user found with this email.' });
          setLoading(false);
          return;
        }
        const userDoc = querySnapshot.docs[0].data();
        if (userDoc.password !== form.password) {
          setFeedback({ type: 'error', message: 'Incorrect password.' });
          setLoading(false);
          return;
        }
        setFeedback({ type: 'success', message: 'Login successful!' });
        onAuthSuccess();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <button style={tabStyle(mode === 'login')} onClick={() => setMode('login')} disabled={mode === 'login'}>Login</button>
          <button style={tabStyle(mode === 'signup')} onClick={() => setMode('signup')} disabled={mode === 'signup'}>Signup</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <button style={tabStyle(userType === 'caretaker')} onClick={() => setUserType('caretaker')} disabled={userType === 'caretaker'}>Caretaker</button>
          <button style={tabStyle(userType === 'caregiver')} onClick={() => setUserType('caregiver')} disabled={userType === 'caregiver'}>Caregiver</button>
        </div>
        <div style={sectionTitleStyle}>{mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}</div>
        {feedback && (
          <div style={{
            background: feedback.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: feedback.type === 'error' ? '#b91c1c' : '#065f46',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 16,
            textAlign: 'center',
            fontWeight: 500,
          }}>{feedback.message}</div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleInputChange}
                style={{ ...inputStyle, ...(focus === 'firstName' ? inputFocusStyle : {}) }}
                onFocus={() => setFocus('firstName')}
                onBlur={() => setFocus('')}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleInputChange}
                style={{ ...inputStyle, ...(focus === 'lastName' ? inputFocusStyle : {}) }}
                onFocus={() => setFocus('lastName')}
                onBlur={() => setFocus('')}
                required
              />
              <input
                type="text"
                name="contact"
                placeholder="Contact Info"
                value={form.contact}
                onChange={handleInputChange}
                style={{ ...inputStyle, ...(focus === 'contact' ? inputFocusStyle : {}) }}
                onFocus={() => setFocus('contact')}
                onBlur={() => setFocus('')}
                required
              />
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInputChange}
            style={{ ...inputStyle, ...(focus === 'email' ? inputFocusStyle : {}) }}
            onFocus={() => setFocus('email')}
            onBlur={() => setFocus('')}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleInputChange}
            style={{ ...inputStyle, ...(focus === 'password' ? inputFocusStyle : {}) }}
            onFocus={() => setFocus('password')}
            onBlur={() => setFocus('')}
            required
          />
          {mode === 'signup' && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleInputChange}
              style={{ ...inputStyle, ...(focus === 'confirmPassword' ? inputFocusStyle : {}) }}
              onFocus={() => setFocus('confirmPassword')}
              onBlur={() => setFocus('')}
              required
            />
          )}
          {userType === 'caregiver' && mode === 'signup' && (
            <div style={{ margin: '18px 0', textAlign: 'center' }}>
              <p style={{ marginBottom: 8, color: '#2563eb', fontWeight: 600 }}>
                Facial Recognition (7 images required)
              </p>
              <button
                type="button"
                onClick={() => setShowFaceModal(true)}
                style={{
                  ...buttonStyle,
                  width: 'auto',
                  background: '#fff',
                  color: '#2563eb',
                  border: '1.5px solid #2563eb',
                  marginTop: 0,
                  marginBottom: 8,
                  boxShadow: 'none',
                }}
              >
                Start Face Enrollment
              </button>
              {faceImages.length > 0 && (
                <div style={{ color: '#059669', marginTop: 8, fontWeight: 500 }}>
                  {faceImages.length} face image{faceImages.length > 1 ? 's' : ''} captured.
                </div>
              )}
            </div>
          )}
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Signup')}
          </button>
        </form>
        {showFaceModal && mode === 'signup' && userType === 'caregiver' && (
          <FaceRecognition
            onComplete={handleFaceComplete}
            onCancel={handleFaceCancel}
            captureCount={7}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage; 