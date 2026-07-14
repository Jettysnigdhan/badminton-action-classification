"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserPoseDetector, landmarksToCoco, CocoKeypoints } from "@/lib/browser-pose";

type PoseLandmarker = any; // MediaPipe PoseLandmarker type

interface UsePoseDetectorOptions {
  targetFps?: number;
  onPose?: (keypoints: CocoKeypoints | null) => void;
  onError?: (error: Error) => void;
}

export function usePoseDetector(options: UsePoseDetectorOptions = {}) {
  const { targetFps = 10, onPose, onError } = options;

  const detectorRef = useRef<PoseLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameCounterRef = useRef(0);
  const lastProcessTimeRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const onPoseRef = useRef(onPose);
  const onErrorRef = useRef(onError);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    onPoseRef.current = onPose;
    onErrorRef.current = onError;
  }, [onPose, onError]);

  // Initialize pose detector
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setIsLoading(true);
        const detector = await createBrowserPoseDetector();
        if (mounted) {
          detectorRef.current = detector;
          setError(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to load pose detector");
        if (mounted) {
          setError(error.message);
          onErrorRef.current?.(error);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Request webcam access
  const startWebcam = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      videoElement.srcObject = stream;
      videoRef.current = videoElement;
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to access webcam");
      setError(error.message);
      onError?.(error);
      return false;
    }
  }, [onError]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Process frame at target FPS
  const processFrame = useCallback(() => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    frameCounterRef.current++;
    const frameInterval = Math.round(1000 / targetFps);
    const now = Date.now();

    if (now - lastProcessTimeRef.current >= frameInterval) {
      try {
        // Detect pose
        const result = detectorRef.current.detectForVideo(videoRef.current, now);
        const keypoints =
          result.landmarks && result.landmarks.length > 0 ? landmarksToCoco(result.landmarks[0]) : null;

        // Expose raw result and converted keypoints for runtime debugging in dev
        try {
          // @ts-ignore - debug hook
          (window as any).__lastMediapipeResult = result;
          // @ts-ignore
          (window as any).__lastKeypoints = keypoints;
        } catch (e) {
          /* ignore in non-browser or restricted env */
        }

        onPoseRef.current?.(keypoints);
        lastProcessTimeRef.current = now;
      } catch (err) {
        console.error("Pose detection error:", err);
      }
    }

    animationIdRef.current = requestAnimationFrame(processFrame);
  }, [targetFps, onPose]);

  // Start detection loop
  const start = useCallback(() => {
    if (!detectorRef.current) {
      setError("Pose detector not initialized");
      return false;
    }
    if (isRunning) return true;

    frameCounterRef.current = 0;
    lastProcessTimeRef.current = Date.now();
    setIsRunning(true);
    animationIdRef.current = requestAnimationFrame(processFrame);
    return true;
  }, [isRunning, processFrame]);

  // Stop detection loop
  const stop = useCallback(() => {
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stop();
      stopWebcam();
    };
  }, [stop, stopWebcam]);

  return {
    videoRef,
    isLoading,
    isRunning,
    error,
    startWebcam,
    stopWebcam,
    start,
    stop,
  };
}
