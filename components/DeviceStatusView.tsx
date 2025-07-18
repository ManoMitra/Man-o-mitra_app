
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { Caregiver, Location } from '../types';
import { textToSpeech } from '../services/textToSpeech';
import { CameraIcon, MicrophoneIcon, SpeakerWaveIcon } from './Icons';

interface DeviceStatusViewProps {
  caregivers: Caregiver[];
  homeLocation?: Location;
}

const DeviceStatusView: React.FC<DeviceStatusViewProps> = ({ caregivers, homeLocation }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastRecognizedName, setLastRecognizedName] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionInterval = useRef<NodeJS.Timeout>();
  const lastAnnouncementTime = useRef<number>(0);
  const ANNOUNCEMENT_COOLDOWN = 5000; // 5 seconds between announcements

  useEffect(() => {
    let mounted = true;
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        if (mounted) setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face recognition models:', err);
        if (mounted) setError('Failed to load face recognition models');
      }
    };
    loadModels();
    return () => { mounted = false; };
  }, []);

  const recognizeFace = async () => {
    if (!webcamRef.current || !webcamRef.current.video || !modelsLoaded) return;

    try {
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Find the closest match among caregivers
        let closestMatch = { name: '', relation: '', distance: 1.0 };
        for (const caregiver of caregivers) {
          if (!caregiver.descriptors?.length) continue;
          
          // Compare with all descriptors of this caregiver
          for (const descriptor of caregiver.descriptors as any[]) {
            // Support both array of arrays and array of objects with values property
            let descArray: number[] | undefined;
            if (Array.isArray(descriptor)) {
              descArray = descriptor;
            } else if (descriptor && typeof descriptor === 'object' && 'values' in descriptor && Array.isArray((descriptor as any).values)) {
              descArray = (descriptor as any).values;
            } else {
              continue;
            }
            if (!Array.isArray(descArray)) continue;
            const distance = faceapi.euclideanDistance(
              detection.descriptor,
              new Float32Array(descArray)
            );
            // Update closest match if this distance is smaller
            if (distance < closestMatch.distance && distance < 0.6) {
              closestMatch = {
                name: caregiver.name,
                relation: caregiver.relation,
                distance
              };
            }
          }
        }

        // If we found a match and enough time has passed since last announcement
        if (closestMatch.name && 
            closestMatch.name !== lastRecognizedName && 
            Date.now() - lastAnnouncementTime.current > ANNOUNCEMENT_COOLDOWN) {
          setLastRecognizedName(closestMatch.name);
          lastAnnouncementTime.current = Date.now();
          
          // Create a natural-sounding announcement
          const announcement = `This is ${closestMatch.name}, your ${closestMatch.relation.toLowerCase()}`;
          await textToSpeech.speak(announcement, {
            rate: 0.9, // Slightly slower for clarity
            pitch: 1.1 // Slightly higher pitch for friendliness
          });
        }
      }
    } catch (err) {
      console.error('Face recognition error:', err);
    }
  };

  const toggleRecognition = () => {
    if (isRecognizing) {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
      setIsRecognizing(false);
    } else {
      recognitionInterval.current = setInterval(recognizeFace, 1000);
      setIsRecognizing(true);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
    };
  }, []);

  // Count caregivers with descriptors
  const caregiversWithDescriptors = caregivers.filter(c => Array.isArray(c.descriptors) && c.descriptors.length > 0);

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-therapy-forest">Device Status</h2>

      {/* Status Overview - Redesigned as attractive cards */}
      <div className="flex gap-8 mb-8">
        {/* Webcam Card */}
        <div className="relative flex flex-col items-center bg-therapy-cream rounded-xl shadow-lg p-4 transition-transform hover:scale-105 hover:shadow-2xl border border-therapy-sage min-w-[120px]">
          <span className="absolute top-2 right-2 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-green-400 shadow-md"></span>
          </span>
          <CameraIcon className="w-10 h-10 text-blue-500 mb-2" />
          <span className="text-green-700 font-semibold">Running</span>
          <span className="text-xs text-therapy-forest/70 mt-1">Webcam</span>
        </div>
        {/* Microphone Card */}
        <div className="relative flex flex-col items-center bg-therapy-cream rounded-xl shadow-lg p-4 transition-transform hover:scale-105 hover:shadow-2xl border border-therapy-sage min-w-[120px]">
          <span className="absolute top-2 right-2 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-green-400 shadow-md"></span>
          </span>
          <MicrophoneIcon className="w-10 h-10 text-pink-500 mb-2" />
          <span className="text-green-700 font-semibold">Running</span>
          <span className="text-xs text-therapy-forest/70 mt-1">Microphone</span>
        </div>
        {/* Speaker Card */}
        <div className="relative flex flex-col items-center bg-therapy-cream rounded-xl shadow-lg p-4 transition-transform hover:scale-105 hover:shadow-2xl border border-therapy-sage min-w-[120px]">
          <span className="absolute top-2 right-2 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-green-400 shadow-md"></span>
          </span>
          <SpeakerWaveIcon className="w-10 h-10 text-yellow-500 mb-2" />
          <span className="text-green-700 font-semibold">Running</span>
          <span className="text-xs text-therapy-forest/70 mt-1">Speaker</span>
        </div>
      </div>

      {/* Facial Recognition Tester (existing) */}
      <div className="mb-4">
        <button
          onClick={toggleRecognition}
          className={`px-4 py-2 rounded font-semibold shadow transition-colors duration-200
            ${isRecognizing 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          disabled={!modelsLoaded}
        >
          {isRecognizing ? 'Stop Recognition' : 'Start Recognition'}
        </button>
        {/* Show warning only if recognition is started and no caregivers with descriptors */}
        {isRecognizing && caregiversWithDescriptors.length === 0 && (
          <div className="mt-2 text-red-600 font-semibold">No caregivers with face data available. Please add face images for at least one caregiver.</div>
        )}
      </div>

      {isRecognizing && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            mirrored
            className="rounded-lg shadow-lg"
            screenshotFormat="image/jpeg"
          />
          {lastRecognizedName ? (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
              Recognized: {lastRecognizedName} ({caregivers.find(c => c.name === lastRecognizedName)?.relation})
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
              Recognizing...
            </div>
          )}
        </div>
      )}

      {/* New: Live Webcam Feed */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2 text-therapy-forest">Live Webcam Feed</h3>
        <div className="bg-therapy-mint/10 rounded-lg p-4 text-center text-therapy-forest/70">
          Camera not found
        </div>
      </div>

      {/* New: Live Location Feed */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2 text-therapy-forest">Live Location Feed</h3>
        <div className="bg-therapy-mint/10 rounded-lg p-4 text-center text-therapy-forest/70">
          {/* For now, show home location if available, else blank */}
          {homeLocation ? (
            <span>Current location: <span className="font-semibold text-therapy-forest">{homeLocation.name}</span></span>
          ) : (
            <span>No location data</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceStatusView;
