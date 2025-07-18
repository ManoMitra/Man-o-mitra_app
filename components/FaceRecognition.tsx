import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';

interface FaceRecognitionProps {
  onComplete: (images: string[], descriptors: number[][]) => void;
  onCancel: () => void;
  captureCount?: number; // Optional, default to 7
}

const CAPTURE_COUNT = 7;
const CAPTURE_INTERVAL = 2000; // 2 seconds
const POSES = [
  "Look straight at the camera",
  "Look up",
  "Look down",
  "Turn to the left",
  "Turn to the right",
  "Smile naturally",
  "Return to looking straight ahead"
];

const MAX_IMAGE_SIZE_MB = 1;
const JPEG_QUALITY = 0.7;

export const compressImage = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 800; // Limit max dimension to 800px
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with high quality
      let quality = JPEG_QUALITY;
      let compressed = canvas.toDataURL('image/jpeg', quality);
      
      // If still too large, reduce quality until under MAX_IMAGE_SIZE_MB
      while (compressed.length > MAX_IMAGE_SIZE_MB * 1024 * 1024 && quality > 0.1) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onComplete, onCancel, captureCount }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [currentPose, setCurrentPose] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const LOCAL_MODEL_URLS = [
      ['/models/ssd_mobilenetv1', '/models/face_landmark_68', '/models/face_recognition'],
      ['https://justadudewhohacks.github.io/face-api.js/models/ssd_mobilenetv1', 'https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68', 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition']
    ];

    const loadModelWithRetry = async (loadFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await loadFn();
          return;
        } catch (err) {
          if (i === maxRetries - 1) throw err;
          await new Promise(res => setTimeout(res, delay));
        }
      }
    };

    async function setBestBackend() {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        if (tf.getBackend() === 'webgl') return;
      } catch (e) {}
      tf.env().set('WASM_PATH', '/tfjs-backend-wasm/');
      await tf.setBackend('wasm');
      await tf.ready();
    }

    async function tryLoadModels() {
      for (const [ssdUrl, landmarkUrl, recogUrl] of LOCAL_MODEL_URLS) {
        try {
          await Promise.all([
            loadModelWithRetry(() => faceapi.nets.ssdMobilenetv1.loadFromUri(ssdUrl)),
            loadModelWithRetry(() => faceapi.nets.faceLandmark68Net.loadFromUri(landmarkUrl)),
            loadModelWithRetry(() => faceapi.nets.faceRecognitionNet.loadFromUri(recogUrl)),
          ]);
          return true; // Success!
        } catch (err) {
          // Try next set of URLs
        }
      }
      throw new Error('Failed to load face recognition models from all sources.');
    }
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        setError(null);
        await setBestBackend();
        await tryLoadModels();
        if (mounted) {
          setModelsLoaded(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load face recognition models:', err);
        if (mounted) {
          setError('Failed to load face recognition models. Please refresh and try again.');
        }
      } finally {
        if (mounted) {
          setIsLoadingModels(false);
        }
      }
    };

    loadModels();
    return () => { mounted = false; };
  }, []);

  const captureImage = async () => {
    if (!webcamRef.current || !modelsLoaded) {
      console.log('Cannot capture: webcam or models not ready');
      return false;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.error('Failed to capture image from webcam');
        setError("Failed to capture image from webcam");
        return false;
      }

      // Compress the image
      const compressedImage = await compressImage(imageSrc);
      console.log('Image compressed successfully');

      // Create an HTML Image element for face detection
      const img = new Image();
      const imgLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
      img.src = compressedImage;
      await imgLoadPromise;

      // Detect face
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        console.log('Face detected successfully');
        setImages(prev => [...prev, compressedImage]);
        setDescriptors(prev => [...prev, Array.from(detection.descriptor)]);
        setError(null);
        return true;
      } else {
        console.log('No face detected in image');
        setError("No face detected. Please adjust your position and ensure good lighting.");
        return false;
      }
    } catch (err) {
      console.error("Error during face capture:", err);
      setError("Failed to process image. Please try again.");
      return false;
    }
  };

  const startCountdown = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);
  };

  const startCapture = async () => {
    if (!modelsLoaded) {
      setError("Face recognition models are not loaded. Please wait.");
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);
      setCapturedCount(0);
      setImages([]);
      setDescriptors([]);
      
      for (let i = 0; i < CAPTURE_COUNT; i++) {
        setCurrentPose(i);
        console.log(`Starting capture ${i + 1}/${CAPTURE_COUNT}`);

        // Start countdown
        await startCountdown();
        
        // Take the photo
        const success = await captureImage();
        
        if (success) {
          setCapturedCount(prev => prev + 1);
          // Short pause before next pose
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // If failed, retry the same pose
          i--;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (images.length >= CAPTURE_COUNT) {
        console.log('Capture sequence completed successfully');
        onComplete(images, descriptors);
      }
    } catch (err) {
      console.error('Error during capture sequence:', err);
      setError('Failed to complete capture sequence. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex justify-center items-center">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setError(null);
                setImages([]);
                setDescriptors([]);
                setCapturedCount(0);
                setCurrentPose(0);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Face Recognition Setup</h2>
        
        <div className="space-y-4">
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
              mirrored
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user",
                aspectRatio: 1.333333
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg text-center">
              {isCapturing ? (
                <>
                  {POSES[currentPose]}
                  {countdown && (
                    <div className="text-2xl font-bold mt-1">
                      {countdown}
                    </div>
                  )}
                </>
              ) : (
                "Click Start when ready"
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Captured: {capturedCount}/{CAPTURE_COUNT}
            </div>
            {!isCapturing && capturedCount < CAPTURE_COUNT && (
              <button
                onClick={startCapture}
                disabled={!modelsLoaded || isLoadingModels}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingModels ? "Loading Models..." : "Start"}
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {!isCapturing && capturedCount >= CAPTURE_COUNT && (
              <button
                onClick={() => onComplete(images, descriptors)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition; 