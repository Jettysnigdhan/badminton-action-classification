"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRtmpose, drawSkeleton, type CocoKeypoints } from "@/lib/rtmpose-browser";

type Prediction = { action: string; confidence: number };
type State = "idle" | "loading" | "running" | "error";
const WINDOW_SIZE = 24;
const MINIMUM_FRAMES = 16;

export function LivePoseAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<BrowserRtmpose | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const keypointsRef = useRef<CocoKeypoints[]>([]);
  const requestInFlightRef = useRef(false);
  const lastRequestRef = useRef(0);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("Start your camera to detect a skeleton locally.");
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) drawSkeleton(canvasRef.current, null);
    setState("idle");
    setMessage("Camera stopped. No video was uploaded.");
  }, []);

  const classify = useCallback(async () => {
    if (requestInFlightRef.current || keypointsRef.current.length < MINIMUM_FRAMES) return;
    requestInFlightRef.current = true;
    try {
      const response = await fetch("/api/classify/keypoints", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keypoints: keypointsRef.current }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Classification failed.");
      setPredictions(body.predictions ?? []);
      setMessage(body.abstain ? "Skeleton detected — waiting for a clearer action." : "Classifying a rolling 24-frame skeleton window.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Live classification failed.");
    } finally {
      requestInFlightRef.current = false;
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!activeRef.current || !videoRef.current || !canvasRef.current || !modelRef.current) return;
    try {
      const points = await modelRef.current.estimate(videoRef.current);
      const canvas = canvasRef.current;
      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }
      drawSkeleton(canvas, points);
      if (points) {
        keypointsRef.current = [...keypointsRef.current, points].slice(-WINDOW_SIZE);
        const now = Date.now();
        if (now - lastRequestRef.current >= 900) {
          lastRequestRef.current = now;
          void classify();
        }
      } else setMessage("No player detected — step back so your full body is visible.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "RTMPose could not process this frame.");
    }
    if (activeRef.current) frameRef.current = requestAnimationFrame(() => void processFrame());
  }, [classify]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setMessage("This browser does not support camera access.");
      return;
    }
    setState("loading");
    setMessage("Loading RTMPose models locally — the first start downloads about 33 MB once.");
    setPredictions([]);
    keypointsRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      modelRef.current ??= await BrowserRtmpose.create();
      activeRef.current = true;
      setState("running");
      setMessage("RTMPose runs in this browser. Only COCO-17 keypoints are sent for classification.");
      void processFrame();
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not start the camera.");
    }
  }, [processFrame]);

  useEffect(() => stop, [stop]);

  return <section className="panel overflow-hidden rounded-3xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.08] px-5 py-4"><div><h3 className="font-display text-base font-semibold tracking-tight text-ink">Live RTMPose analysis</h3><p className="mt-0.5 text-xs text-muted">Camera frames stay on this device; only skeleton coordinates reach the classifier.</p></div>{state === "running" ? <button type="button" onClick={stop} className="rounded-full border border-line/15 px-4 py-2 text-sm font-medium text-muted hover:bg-overlay/60 hover:text-ink">Stop camera</button> : <button type="button" onClick={() => void start()} disabled={state === "loading"} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-60">{state === "loading" ? "Loading models…" : "Start live camera"}</button>}</div>
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]"><div className="relative aspect-video overflow-hidden rounded-2xl bg-midnight ring-1 ring-inset ring-line/10"><video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full -scale-x-100 object-cover" /><canvas ref={canvasRef} aria-label="Live RTMPose skeleton overlay" className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />{state !== "running" && <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-white/65">{message}</div>}</div><div className="rounded-2xl bg-overlay/50 p-4 ring-1 ring-inset ring-line/[0.08]"><p className="text-xs font-medium uppercase tracking-wider text-muted">Live prediction</p>{predictions.length ? <ol className="mt-4 space-y-3">{predictions.slice(0, 3).map((prediction, index) => <li key={prediction.action}><div className="flex justify-between gap-3 text-sm"><span className={index === 0 ? "font-semibold text-ink" : "text-muted"}>{prediction.action}</span><span className="font-mono text-ink">{prediction.confidence.toFixed(1)}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-gradient-to-r from-indigo to-cyan" style={{ width: `${prediction.confidence}%` }} /></div></li>)}</ol> : <p className="mt-4 text-sm text-muted">Hold a full-body badminton stance for a few seconds.</p>}<p className="mt-5 border-t border-line/[0.08] pt-3 text-xs leading-5 text-muted">{message}</p></div></div>
  </section>;
}
