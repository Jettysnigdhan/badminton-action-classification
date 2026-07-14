"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";
import { PoseOverlay } from "./PoseOverlay";
import { usePoseDetector } from "@/hooks/usePoseDetector";
import { CocoKeypoints } from "@/lib/browser-pose";

type Status = "idle" | "initializing" | "ready" | "running" | "error";
type Prediction = { action: string; confidence: number };

const SEQUENCE_LENGTH = 30; // frames
const CLASSIFICATION_FPS = 10;
const FRAME_SKIP = Math.round(10 / CLASSIFICATION_FPS); // Process every 1 frame for 10 FPS

export function LiveDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsRecording, setSupportsRecording] = useState(false);
  const [currentKeypoints, setCurrentKeypoints] = useState<CocoKeypoints | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Keypoint sequence buffer
  const keypointBufferRef = useRef<CocoKeypoints[]>([]);
  const frameCountRef = useRef(0);

  // Initialize pose detector
  const { isLoading, isRunning, startWebcam, stopWebcam, start, stop } = usePoseDetector({
    targetFps: 10,
    onPose: (keypoints) => {
      setCurrentKeypoints(keypoints);

      if (keypoints) {
        keypointBufferRef.current.push(keypoints);
        if (keypointBufferRef.current.length > SEQUENCE_LENGTH) {
          keypointBufferRef.current.shift();
        }

        frameCountRef.current++;

        // Classify every N frames
        if (frameCountRef.current % FRAME_SKIP === 0 && keypointBufferRef.current.length === SEQUENCE_LENGTH) {
          classifyPoses(keypointBufferRef.current);
        }
      }
    },
    onError: (err) => {
      setError(err.message);
      setStatus("error");
    },
  });

  // Classify pose sequence
  const classifyPoses = useCallback(async (keypoints: CocoKeypoints[]) => {
    try {
      const response = await fetch("/api/classify/keypoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keypoints }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Classification failed");
      }

      const result = await response.json();
      setPredictions(result.predictions || []);
    } catch (err) {
      console.error("Classification error:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof MediaRecorder === "undefined") {
      setSupportsRecording(false);
      return;
    }
    const supported = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") || MediaRecorder.isTypeSupported("video/webm;codecs=vp8") || MediaRecorder.isTypeSupported("video/webm");
    setSupportsRecording(supported);
  }, []);

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!videoRef.current?.srcObject) return;

    recordedChunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (err) {
      console.error("Record start failed", err);
      setError("Recording is not available in this browser.");
      return;
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `badminton-classification-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Start streaming
  const handleStart = useCallback(async () => {
    try {
      setStatus("initializing");
      setError(null);

      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error("Video element not found");
      }

      const success = await startWebcam(videoElement);
      if (!success) {
        setStatus("error");
        return;
      }

      // Wait for video to load
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          setVideoSize({
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          });
          resolve(null);
        };
      });

      // Clear buffers
      keypointBufferRef.current = [];
      frameCountRef.current = 0;
      setPredictions(null);

      // Start pose detection
      start();
      setIsStreaming(true);
      setStatus("running");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start stream";
      setError(message);
      setStatus("error");
    }
  }, [startWebcam, start]);

  // Stop streaming
  const handleStop = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    }
    stop();
    stopWebcam();
    setIsStreaming(false);
    setStatus("ready");
    setCurrentKeypoints(null);
    setPredictions(null);
    keypointBufferRef.current = [];
    frameCountRef.current = 0;
  }, [stop, stopWebcam, isRecording, handleStopRecording]);

  // Reset everything
  const handleReset = () => {
    if (isStreaming) {
      handleStop();
    }
    setStatus("idle");
    setError(null);
    setPredictions(null);
  };

  return (
    <section id="live-demo" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          align="center"
          eyebrow="Live Recording"
          title="Real-time badminton shot classification"
          description="Record live with your webcam and get shot predictions instantly from your body pose. The model processes 30-frame sequences at 10 FPS using pose keypoints extracted from your stream."
        />

        <Reveal delay={0.05}>
          <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border bg-midnight p-2 shadow-card">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-b from-[#0a1726] to-midnight p-6 sm:p-10">
              <div aria-hidden className="absolute inset-0 dot-grid opacity-40" />

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={
                  status === "initializing" || status === "ready" || status === "running"
                    ? "h-full w-full object-cover"
                    : "hidden"
                }
              />

              <AnimatePresence mode="wait">
                {/* Loading state */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative flex min-h-[400px] items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="mb-4 inline-block">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                      </div>
                      <p className="text-sm text-white/70">Loading pose detector...</p>
                    </div>
                  </motion.div>
                )}

                {/* Error state */}
                {status === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative flex min-h-[400px] flex-col items-center justify-center text-center"
                  >
                    <div className="mb-4 rounded-full bg-red-500/15 p-3">
                      <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6V9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="mb-6 max-w-sm text-sm text-red-400">{error || "An error occurred"}</p>
                    <button
                      onClick={handleReset}
                      className="rounded-lg bg-cyan/10 px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}

                {/* Idle state */}
                {status === "idle" && !isLoading && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative flex min-h-[400px] flex-col items-center justify-center text-center"
                  >
                    <svg className="mb-4 h-12 w-12 text-cyan/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mb-6 max-w-sm text-white/70">
                      Click the button below to start your webcam, record live, and classify your shots in real time.
                    </p>
                    <button
                      onClick={handleStart}
                      className="rounded-lg bg-cyan px-6 py-2 text-sm font-semibold text-midnight hover:bg-cyan/90 transition-colors"
                    >
                      Start Live Recording
                    </button>
                  </motion.div>
                )}

                {/* Video stream state */}
                {(status === "initializing" || status === "ready" || status === "running") && (
                  <motion.div
                    key="stream"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative space-y-4"
                  >
                    {/* Video container */}
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black" ref={canvasContainerRef}>
                      <div className="absolute inset-0">
                        {/* The actual video is mounted above to keep the ref available before start */}
                      </div>
                      {currentKeypoints && videoSize.width > 0 && (
                        <div className="absolute inset-0">
                          <PoseOverlay
                            keypoints={currentKeypoints}
                            videoWidth={videoSize.width}
                            videoHeight={videoSize.height}
                            opacity={0.9}
                          />
                        </div>
                      )}
                      {currentKeypoints && videoSize.width > 0 && (
                        <div className="absolute inset-0">
                          <PoseOverlay
                            keypoints={currentKeypoints}
                            videoWidth={videoSize.width}
                            videoHeight={videoSize.height}
                            opacity={0.9}
                          />
                        </div>
                      )}

                      {/* Loading indicator */}
                      {status === "initializing" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                        </div>
                      )}
                    </div>

                    {/* Control buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {!isStreaming ? (
                        <button
                          onClick={handleStart}
                          disabled={isLoading}
                          className="flex-1 rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-midnight hover:bg-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Start Stream
                        </button>
                      ) : (
                        <button
                          onClick={handleStop}
                          className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          Stop Stream
                        </button>
                      )}

                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <button
                          onClick={isRecording ? handleStopRecording : handleStartRecording}
                          disabled={!isStreaming || !supportsRecording}
                          className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isRecording ? "Stop Recording" : "Record Session"}
                        </button>
                        <button
                          onClick={handleReset}
                          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    {isStreaming && !supportsRecording && (
                      <p className="mt-2 text-xs text-rose-300">Recording is not supported in your browser.</p>
                    )}
                    {isRecording && (
                      <p className="mt-2 text-xs text-cyan-200">Recording in progress. Stop to download the clip.</p>
                    )}

                    {/* Status info */}
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                      <div className="flex items-center justify-between">
                        <span>
                          {isStreaming ? "🔴 Live" : "⏸️ Paused"} • Frames: {frameCountRef.current} • Buffered:{" "}
                          {keypointBufferRef.current.length}/{SEQUENCE_LENGTH}
                        </span>
                        {predictions && predictions.length > 0 && (
                          <span className="text-cyan">✓ {predictions[0].action}</span>
                        )}
                      </div>
                    </div>

                    {/* Predictions */}
                    {predictions && predictions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 rounded-lg border border-cyan/20 bg-cyan/10 p-4"
                      >
                        <div className="text-xs font-medium text-cyan">Classifications</div>
                        <div className="space-y-2">
                          {predictions.slice(0, 5).map((pred, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-white/70">{pred.action}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan to-blue-500"
                                    style={{ width: `${pred.confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/60 w-10 text-right">{pred.confidence.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
