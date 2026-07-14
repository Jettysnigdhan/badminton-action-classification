"use client";

import { useEffect, useRef } from "react";
import { drawSkeleton, CocoKeypoints } from "@/lib/browser-pose";

interface PoseOverlayProps {
  keypoints: CocoKeypoints | null;
  videoWidth: number;
  videoHeight: number;
  opacity?: number;
}

export function PoseOverlay({ keypoints, videoWidth, videoHeight, opacity = 1 }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match canvas to video dimensions
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Draw skeleton
    drawSkeleton(canvas, keypoints);
  }, [keypoints, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity }}
    />
  );
}
