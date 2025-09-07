
"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface CameraViewProps {
  onCapture: (imageDataUri: string) => void;
  facingMode: 'user' | 'environment';
}

export function CameraView({ onCapture, facingMode }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  const takePicture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) {
        return;
    }
    
    const video = videoRef.current;
    if (video.readyState < 2) { // Ensure video is ready
        console.warn('Video not ready for capture.');
        // Optionally, retry or show an error
        return;
    }

    setIsCapturing(true);

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Flip the image horizontally for user-facing camera
      if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      
      // Stop the camera stream after capture
      stopCamera();
      
      // Defer state update to avoid conflicts
      setTimeout(() => onCapture(dataUri), 0);
    } else {
        setError('Failed to get canvas context.');
        setIsCapturing(false);
    }
  }, [onCapture, facingMode, stopCamera, isCapturing]);

  const startCamera = useCallback(async () => {
    // Ensure we don't start a new stream if one is already active
    if (streamRef.current) return;

    setIsInitializing(true);
    setError(null);
    setIsCapturing(false);

    if (!navigator.mediaDevices?.getUserMedia) {
        const message = "Your browser does not support camera access.";
        setError(message);
        toast({ variant: 'destructive', title: 'Compatibility Error', description: message });
        setIsInitializing(false);
        return;
    }

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });

        streamRef.current = newStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            // Muted is important for autoplay to work in most browsers
            if(videoRef.current) videoRef.current.muted = true; 
            videoRef.current?.play().catch(err => {
                 console.error("Video play failed:", err);
                 setError("Failed to start the video stream.");
                 setIsInitializing(false);
            });
          };

          videoRef.current.oncanplay = () => {
            // This ensures we only run this logic once when the camera is truly ready
            if (isInitializing) {
                setIsInitializing(false);
                // Set the automatic capture timeout
                if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
                captureTimeoutRef.current = setTimeout(takePicture, 5000);
            }
          };
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        let message = "Could not access the camera. Please check permissions.";
        if (err instanceof DOMException) {
            if (err.name === "NotAllowedError") {
                message = "Camera access was denied. Please allow camera access in your browser settings.";
            } else if (err.name === "NotFoundError" || err.name === 'OverconstrainedError') {
                message = `No camera with facing mode '${facingMode}' was found. Please ensure it is connected and enabled.`;
            }
        }
        setError(message);
        setIsInitializing(false);
    }
  }, [facingMode, toast, takePicture, isInitializing]);

  // Effect for starting and stopping the camera on mount/unmount
  useEffect(() => {
    startCamera();
    
    // Cleanup function to stop the camera when the component unmounts
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 bg-card rounded-lg">
      <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border-2 border-muted bg-black">
        <video
          ref={videoRef}
          playsInline
          className={`w-full h-full object-cover transform ${facingMode === 'user' ? '-scale-x-100' : ''} ${isCapturing ? 'blur-sm' : ''} ${(isInitializing || error) ? 'hidden' : 'block'}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white p-4 text-center">
            {isInitializing && !error && (
              <>
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Initializing Camera...</p>
              </>
            )}

            {!isInitializing && !isCapturing && !error && (
                <p className="text-lg font-semibold">Hold still, capturing in a moment...</p>
            )}

            {error && !isInitializing && (
                <>
                    <CameraOff className="w-12 h-12 text-destructive mb-4" />
                    <Alert variant="destructive">
                        <AlertTitle>Camera Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={startCamera} variant="secondary" className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </>
            )}

             {isCapturing && (
                <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>Processing...</p>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
