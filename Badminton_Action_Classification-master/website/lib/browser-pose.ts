export type CocoKeypoints = Array<[number, number, number]>;

// MediaPipe Pose has 33 landmarks. These indices map it into the exact COCO-17
// order consumed by the trained Python feature extractor.
const COCO_FROM_MEDIAPIPE = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

export const COCO_EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
];

export async function createBrowserPoseDetector() {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  );
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    // Lower thresholds slightly for dev to improve keypoint recall on varied inputs
    minPoseDetectionConfidence: 0.3,
    minPosePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
}

export function landmarksToCoco(landmarks: Array<{ x: number; y: number; visibility?: number; presence?: number }>): CocoKeypoints {
  return COCO_FROM_MEDIAPIPE.map((index) => {
    const point = landmarks[index];
    return [point?.x ?? 0, point?.y ?? 0, Math.max(0, Math.min(1, point?.visibility ?? point?.presence ?? 0))];
  });
}

export function drawSkeleton(canvas: HTMLCanvasElement, keypoints: CocoKeypoints | null) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!keypoints) return;

  context.lineWidth = Math.max(2, canvas.width / 280);
  context.lineCap = "round";
  context.strokeStyle = "#00d4ff";
  for (const [from, to] of COCO_EDGES) {
    const a = keypoints[from];
    const b = keypoints[to];
    if (a[2] < 0.35 || b[2] < 0.35) continue;
    context.beginPath();
    context.moveTo(a[0] * canvas.width, a[1] * canvas.height);
    context.lineTo(b[0] * canvas.width, b[1] * canvas.height);
    context.stroke();
  }
  context.fillStyle = "#ffffff";
  for (const [x, y, confidence] of keypoints) {
    if (confidence < 0.35) continue;
    context.beginPath();
    context.arc(x * canvas.width, y * canvas.height, Math.max(3, canvas.width / 140), 0, Math.PI * 2);
    context.fill();
  }
}
