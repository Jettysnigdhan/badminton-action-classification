"use client";

import * as ort from "onnxruntime-web";

export type CocoKeypoints = Array<[number, number, number]>;

const DETECTOR_MODEL = "/models/rtmpose/detector/20230928/yolox_onnx/yolox_tiny_8xb8-300e_humanart-6f3252f9/end2end.onnx";
const POSE_MODEL = "/models/rtmpose/pose/20230831/rtmpose_onnx/rtmpose-t_simcc-body7_pt-body7_420e-256x192-026a1439_20230504/end2end.onnx";
const DETECTOR_SIZE = 416;
const POSE_WIDTH = 192;
const POSE_HEIGHT = 256;
const MEAN = [123.675, 116.28, 103.53];
const STD = [58.395, 57.12, 57.375];

export const COCO_EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
];

type Box = { x: number; y: number; width: number; height: number };

function canvas(width: number, height: number) {
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  return surface;
}

function imageTensor(surface: HTMLCanvasElement, bgr: boolean, normalize: boolean) {
  const pixels = surface.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, surface.width, surface.height).data;
  const area = surface.width * surface.height;
  const data = new Float32Array(area * 3);
  for (let index = 0; index < area; index += 1) {
    const pixel = index * 4;
    for (let channel = 0; channel < 3; channel += 1) {
      const source = bgr ? 2 - channel : channel;
      const value = pixels[pixel + source];
      data[channel * area + index] = normalize ? (value - MEAN[channel]) / STD[channel] : value;
    }
  }
  return data;
}

function largestBox(detections: ort.Tensor, labels: ort.Tensor, scale: number): Box | null {
  const values = detections.data as Float32Array;
  const classes = labels.data as Int64Array | BigInt64Array;
  const rowWidth = detections.dims[detections.dims.length - 1];
  let best: Box | null = null;
  let bestScore = 0.45;
  for (let row = 0; row < values.length / rowWidth; row += 1) {
    const offset = row * rowWidth;
    const score = values[offset + 4];
    const label = Number(classes[row]);
    if (label !== 0 || score < bestScore) continue;
    bestScore = score;
    best = {
      x: values[offset] / scale,
      y: values[offset + 1] / scale,
      width: (values[offset + 2] - values[offset]) / scale,
      height: (values[offset + 3] - values[offset + 1]) / scale,
    };
  }
  return best;
}

function argmax(values: Float32Array, offset: number, length: number) {
  let value = -Infinity;
  let index = 0;
  for (let i = 0; i < length; i += 1) {
    if (values[offset + i] > value) {
      value = values[offset + i];
      index = i;
    }
  }
  return { index, value };
}

export class BrowserRtmpose {
  private detector: ort.InferenceSession;
  private pose: ort.InferenceSession;
  private detectorCanvas = canvas(DETECTOR_SIZE, DETECTOR_SIZE);
  private poseCanvas = canvas(POSE_WIDTH, POSE_HEIGHT);

  private constructor(detector: ort.InferenceSession, pose: ort.InferenceSession) {
    this.detector = detector;
    this.pose = pose;
  }

  static async create() {
    ort.env.wasm.numThreads = 1;
    const options: ort.InferenceSession.SessionOptions = { executionProviders: ["wasm"] };
    const [detector, pose] = await Promise.all([
      ort.InferenceSession.create(DETECTOR_MODEL, options),
      ort.InferenceSession.create(POSE_MODEL, options),
    ]);
    return new BrowserRtmpose(detector, pose);
  }

  async estimate(video: HTMLVideoElement): Promise<CocoKeypoints | null> {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const detectorContext = this.detectorCanvas.getContext("2d")!;
    detectorContext.fillStyle = "rgb(114, 114, 114)";
    detectorContext.fillRect(0, 0, DETECTOR_SIZE, DETECTOR_SIZE);
    const scale = Math.min(DETECTOR_SIZE / width, DETECTOR_SIZE / height);
    detectorContext.drawImage(video, 0, 0, width, height, 0, 0, width * scale, height * scale);
    const detectorInput = new ort.Tensor("float32", imageTensor(this.detectorCanvas, true, false), [1, 3, DETECTOR_SIZE, DETECTOR_SIZE]);
    const detection = await this.detector.run({ [this.detector.inputNames[0]]: detectorInput });
    const box = largestBox(detection[this.detector.outputNames[0]], detection[this.detector.outputNames[1]], scale);
    if (!box) return null;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const cropScale = Math.max(box.width / POSE_WIDTH, box.height / POSE_HEIGHT) * 1.25;
    const cropWidth = POSE_WIDTH * cropScale;
    const cropHeight = POSE_HEIGHT * cropScale;
    const cropX = centerX - cropWidth / 2;
    const cropY = centerY - cropHeight / 2;
    const poseContext = this.poseCanvas.getContext("2d")!;
    poseContext.fillStyle = "rgb(0, 0, 0)";
    poseContext.fillRect(0, 0, POSE_WIDTH, POSE_HEIGHT);
    poseContext.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, POSE_WIDTH, POSE_HEIGHT);
    const poseInput = new ort.Tensor("float32", imageTensor(this.poseCanvas, false, true), [1, 3, POSE_HEIGHT, POSE_WIDTH]);
    const output = await this.pose.run({ [this.pose.inputNames[0]]: poseInput });
    const xScores = output[this.pose.outputNames[0]].data as Float32Array;
    const yScores = output[this.pose.outputNames[1]].data as Float32Array;
    const xBins = xScores.length / 17;
    const yBins = yScores.length / 17;
    return Array.from({ length: 17 }, (_, joint) => {
      const x = argmax(xScores, joint * xBins, xBins);
      const y = argmax(yScores, joint * yBins, yBins);
      const confidence = Math.max(0, Math.min(1, Math.min(x.value, y.value)));
      return [
        (cropX + (x.index / 2 / POSE_WIDTH) * cropWidth) / width,
        (cropY + (y.index / 2 / POSE_HEIGHT) * cropHeight) / height,
        confidence,
      ] as [number, number, number];
    });
  }
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
    if (a[2] < 0.3 || b[2] < 0.3) continue;
    context.beginPath();
    context.moveTo(a[0] * canvas.width, a[1] * canvas.height);
    context.lineTo(b[0] * canvas.width, b[1] * canvas.height);
    context.stroke();
  }
  context.fillStyle = "#ffffff";
  for (const [x, y, score] of keypoints) {
    if (score < 0.3) continue;
    context.beginPath();
    context.arc(x * canvas.width, y * canvas.height, Math.max(3, canvas.width / 140), 0, Math.PI * 2);
    context.fill();
  }
}
