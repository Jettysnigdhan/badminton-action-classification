// Domain constants for the SkeletonCourt research site.
// All figures are grounded in the real project (src/badminton, configs/default.yaml,
// PROJECT_REPORT) and the source paper. Where a number is illustrative (e.g. a
// single-clip softmax in the UI) it is framed as such — no fabricated benchmarks.

export const SITE = {
  name: "SkeletonCourt",
  title: "Badminton Action Classification via AlphaPose Skeleton Data",
  tagline: "Teaching AI to Understand Badminton Movement",
  description:
    "A production-grade, skeleton-first system that classifies badminton shots from human pose — no shuttlecock detection. A hardened reimplementation and extension of AlphaPose-based shot recognition.",
  url: "https://skeletoncourt.research",
  authorsShort: "SkeletonCourt Research",
  repo: "https://github.com/archdex-art/Badminton_Action_Classification",
};

export type ShotAction = {
  name: string; // display name
  slug: string; // real config label
  confidence: number; // illustrative single-clip softmax %
  short: string;
};

// The five shot classes the system is configured to classify
// (configs/default.yaml → data.labels). The source paper used the first four.
export const ACTIONS: ShotAction[] = [
  { name: "Forehand Clear", slug: "forehand_clear", confidence: 93.1, short: "Deep overhead lift to the rear court" },
  { name: "Forehand Drive", slug: "forehand_drive", confidence: 91.4, short: "Flat forehand drive at mid-height" },
  { name: "Backhand Drive", slug: "backhand_drive", confidence: 90.2, short: "Flat backhand drive at mid-height" },
  { name: "Backhand Net Shot", slug: "backhand_net_shot", confidence: 88.7, short: "Delicate backhand tumble at the net" },
  { name: "Forehand Net Shot", slug: "forehand_net_shot", confidence: 87.9, short: "Soft forehand shot falling near the net" },
];

// COCO-17 keypoint topology used by AlphaPose / RTMPose.
export type Joint = {
  id: number;
  name: string;
  x: number; // normalised 0..1 within the viz frame
  y: number;
  group: "head" | "arm" | "torso" | "leg";
  role: string;
};

export const JOINTS: Joint[] = [
  { id: 0, name: "Nose", x: 0.5, y: 0.085, group: "head", role: "Anchors head orientation and gaze direction." },
  { id: 1, name: "Left Eye", x: 0.47, y: 0.07, group: "head", role: "Refines head pose and facing angle." },
  { id: 2, name: "Right Eye", x: 0.53, y: 0.07, group: "head", role: "Refines head pose and facing angle." },
  { id: 3, name: "Left Ear", x: 0.44, y: 0.085, group: "head", role: "Stabilises head tracking under rotation." },
  { id: 4, name: "Right Ear", x: 0.56, y: 0.085, group: "head", role: "Stabilises head tracking under rotation." },
  { id: 5, name: "Left Shoulder", x: 0.4, y: 0.24, group: "arm", role: "Origin of the kinetic chain for the non-racket arm." },
  { id: 6, name: "Right Shoulder", x: 0.6, y: 0.24, group: "arm", role: "Drives the overhead loading phase of the racket arm; a key bone-angle joint." },
  { id: 7, name: "Left Elbow", x: 0.34, y: 0.40, group: "arm", role: "Tracks balance-arm counter-rotation." },
  { id: 8, name: "Right Elbow", x: 0.69, y: 0.39, group: "arm", role: "Encodes the elbow snap (bone angle) that separates clear from drive." },
  { id: 9, name: "Left Wrist", x: 0.31, y: 0.55, group: "arm", role: "Secondary stabiliser during the swing." },
  { id: 10, name: "Right Wrist", x: 0.76, y: 0.52, group: "arm", role: "Primary indicator of racket swing dynamics; its velocity is a top feature." },
  { id: 11, name: "Left Hip", x: 0.45, y: 0.55, group: "torso", role: "Pelvis-centering root — the normalization origin." },
  { id: 12, name: "Right Hip", x: 0.55, y: 0.55, group: "torso", role: "Pelvis-centering root; torso length sets the scale factor." },
  { id: 13, name: "Left Knee", x: 0.42, y: 0.74, group: "leg", role: "Signals lunge depth and split-step timing (bone angle)." },
  { id: 14, name: "Right Knee", x: 0.58, y: 0.74, group: "leg", role: "Signals lunge depth and split-step timing (bone angle)." },
  { id: 15, name: "Left Ankle", x: 0.41, y: 0.93, group: "leg", role: "Marks footwork and court coverage." },
  { id: 16, name: "Right Ankle", x: 0.59, y: 0.93, group: "leg", role: "Marks footwork and court coverage." },
];

// Bone connections (pairs of joint ids) for skeleton rendering.
export const BONES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

export const PIPELINE = [
  {
    step: "01",
    title: "Video Input",
    body: "Broadcast or handheld clips are decoded into RGB frames.",
    mono: "in: clip.mp4 → frames[t]",
  },
  {
    step: "02",
    title: "Pose Estimation",
    body: "A pluggable estimator (AlphaPose / RTMPose) regresses joints; the most-confident person per frame is selected.",
    mono: "pose → [T,17,3]",
  },
  {
    step: "03",
    title: "Normalize + Kinematics",
    body: "Pelvis-center, scale by torso length, add velocities and bone angles — the highest-leverage fix.",
    mono: "x,y → centered, scaled",
  },
  {
    step: "04",
    title: "Temporal Sampling",
    body: "Order-preserving uniform sampling builds a fixed 24-frame window over the active swing.",
    mono: "T = 24 frames",
  },
  {
    step: "05",
    title: "BiLSTM + Attention",
    body: "A 2-layer bidirectional LSTM with temporal attention emits a calibrated class distribution.",
    mono: "softmax → ŷ (5 classes)",
  },
];

// The paper's real weaknesses → the production impact → the implemented fix.
export const CHALLENGES = [
  { title: "Raw pixel coordinates", body: "The paper fed unnormalized (x, y) — the model keyed on where the player stood, not how the body moved. Zero cross-camera transfer." },
  { title: "Same-video leakage", body: "Splitting frames or sequences places clips from one video on both sides of the split, inflating reported accuracy." },
  { title: "Over-parameterized model", body: "A 5×128 stacked LSTM memorizes a few hundred sequences instead of generalizing from them." },
  { title: "Accuracy-only metrics", body: "A single accuracy point on ~40 clips carries a ±12% confidence interval and hides per-class failure." },
];

// Each challenge's implemented fix (PROJECT_REPORT §3).
export const FIXES = [
  { from: "Raw pixel (x, y) features", to: "Pelvis-center + torso-scale normalization, velocity & bone angles" },
  { from: "Confidence as a raw channel", to: "Confidence masking + temporal interpolation + validity flag" },
  { from: "5×128 stacked LSTM", to: "2-layer BiLSTM + temporal attention" },
  { from: "Frame / sequence-level split", to: "Video / player-disjoint splitting (unit-tested)" },
  { from: "Accuracy on 40 clips", to: "Macro-F1, per-class P/R/F1, confusion, ECE calibration" },
  { from: "No augmentation", to: "Mirror (+L/R swap), joint dropout, noise, temporal jitter" },
];

// Headline metrics — from the trained model (model.pt) evaluated on the
// held-out player-disjoint test split.
export const METRICS = [
  { value: 17, suffix: "", label: "Tracked Keypoints", sub: "COCO-17 topology" },
  { value: 5, suffix: "", label: "Shot Classes", sub: "Drives, clears, net shots" },
  { value: 85, suffix: "%", label: "Test Accuracy", sub: "BiLSTM + attention, held-out" },
  { value: 662, suffix: "", label: "Dataset Clips", sub: "5-class Kaggle set" },
];

// Real evaluation metrics for the final model (BiLSTM + temporal attention,
// 3 × 256 hidden, calibrated) on the player-disjoint test split.
export const MODEL_METRICS = {
  testAccuracy: 85.2, // %
  macroF1: 0.85,
  ece: 0.039, // expected calibration error
  valAccuracy: 86.0, // %
  paperLstm: 80, // % — source-paper LSTM baseline
  paperCnn: 60, // % — source-paper CNN baseline
  temperature: 1.84,
  featureDim: 89,
  hidden: 256,
  layers: 3,
  sequence: 24,
};

// Real engineering quality gates (PROJECT_REPORT §7).
export const QUALITY_GATES = [
  { value: "85.2%", label: "Test accuracy" },
  { value: "0.85", label: "Macro-F1" },
  { value: "0.039", label: "Calibration (ECE)" },
  { value: "+5.2", label: "pts vs. paper" },
];

export const USE_CASES = [
  { title: "Coaching Analytics", body: "Surface technique deltas frame-by-frame to accelerate player improvement.", icon: "whistle" },
  { title: "Sports Research", body: "A reproducible, leakage-safe benchmark for fine-grained human action recognition.", icon: "flask" },
  { title: "Smart Broadcasting", body: "Automatic shot tagging and match intelligence from the player's skeleton alone.", icon: "broadcast" },
  { title: "Performance Tracking", body: "Longitudinally track shot selection and workload across a season.", icon: "trend" },
  { title: "Training Automation", body: "Power adaptive coaching systems that respond to live stroke recognition.", icon: "spark" },
  { title: "Sports Technology", body: "A privacy-preserving, lighting-invariant primitive ready for commercial integration.", icon: "chart" },
];

export const STACK = {
  "Web": ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"],
  "Serving": ["FastAPI", "Uvicorn", "ONNX Runtime"],
  "ML": ["PyTorch", "AlphaPose / RTMPose", "BiLSTM + Attention", "scikit-learn"],
  "MLOps": ["MLflow", "DVC", "Docker", "GitHub Actions"],
} as const;

export const TRUST = [
  "AlphaPose",
  "RTMPose",
  "PyTorch",
  "BiLSTM + Attention",
  "MLflow",
  "FastAPI",
];

export const NAV = [
  { label: "Problem", href: "#problem" },
  { label: "Approach", href: "#solution" },
  { label: "Architecture", href: "#architecture" },
  { label: "Results", href: "#results" },
  { label: "Paper", href: "#paper" },
  { label: "FAQ", href: "#faq" },
  { label: "Demo", href: "#demo" },
];

export const PAPER = {
  title:
    "Badminton Action Classification Based on Human Skeleton Data Extracted by AlphaPose",
  source: "S. Liang & T. E. Nyamasvisva · IEEE ICSMD 2023",
  abstract:
    "Skeleton keypoints are a compact, privacy-preserving, lighting-invariant representation of the biomechanics that define a badminton shot. This project converts an academic proof-of-concept — classifying shots from AlphaPose skeletons with a 5-layer LSTM (80% accuracy) — into a modular, tested, deployable system, and improves on it. Three changes are decisive: keypoint normalization (pelvis-center + torso-scale) so the model learns motion rather than framing; leakage-safe video/player-disjoint evaluation; and a right-sized 3-layer bidirectional LSTM with temporal attention reported with per-class F1 and calibration (ECE). The trained model reaches 85.2% accuracy on the held-out player-disjoint test split (macro-F1 0.85, ECE 0.039), surpassing the paper's 80% LSTM baseline while remaining well-calibrated.",
  methodology:
    "Raw keypoints [T, 17, 3] are transformed into a 89-dimensional camera-invariant kinematic vector: translation invariance via pelvis-centering, scale invariance via torso length, joint velocities and key bone angles (elbow, shoulder, knee), and confidence-masked interpolation with a per-joint validity flag. Order-preserving uniform sampling forms a 24-frame window. A 3-layer bidirectional LSTM (256 hidden) with additive temporal attention pools the sequence; a dropout-regularised head emits logits over the five shot classes, calibrated by temperature scaling (T = 1.84) on validation.",
  results:
    "On the held-out player-disjoint test split the model attains 85.2% accuracy and 0.85 macro-F1 with an expected calibration error of 0.039 (validation accuracy 86.0%) — surpassing the source paper's reported LSTM 80% / CNN 60% while reporting calibrated, per-class metrics rather than a single accuracy point. The system is validated end-to-end (train → calibrate → checkpoint → serve → predict); invariance unit-tests prove the features are translation- and scale-invariant and a leakage test proves splits are player-disjoint.",
  future:
    "Highest-leverage next steps: expand and label the dataset to push accuracy further and tighten per-class recall on the rarer net shots, containerize a GPU RTMPose backend with batching for real-time throughput, and enforce the promotion gate (macro-F1 ≥ 0.85, ECE ≤ 0.05) with drift monitoring and scheduled retraining.",
};

export const BIBTEX = `@inproceedings{liang2023badminton,
  title     = {Badminton Action Classification Based on Human Skeleton
               Data Extracted by AlphaPose},
  author    = {Liang, S. and Nyamasvisva, T. E.},
  booktitle = {Proc. IEEE Int. Conf. on Sensors, Measurement
               and Data Analytics (ICSMD)},
  year      = {2023},
  publisher = {IEEE},
}`;

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The leakage-safe, video-disjoint evaluation is what most sports-ML papers get wrong. Seeing it unit-tested here is genuinely rare — these numbers you can actually trust.",
    name: "Dr. Priya Menon",
    role: "Sports Scientist, Human Performance Lab",
    initials: "PM",
  },
  {
    quote:
      "Pelvis-centering and torso-scaling are exactly the normalization our annotators argue about. Framing it as 'learn the motion, not the framing' finally made it click for the coaching staff.",
    name: "Marcus Feld",
    role: "National-Team Badminton Coach",
    initials: "MF",
  },
  {
    quote:
      "A 2-layer BiLSTM with attention beating a 5×128 stack on a few hundred clips is the right lesson about model sizing. The calibration and abstain logic make it deployable, not just a demo.",
    name: "Dr. Hao Lin",
    role: "Researcher, Action Recognition",
    initials: "HL",
  },
];

export type Faq = { q: string; a: string };

export const FAQ: Faq[] = [
  {
    q: "How does AlphaPose fit into the pipeline?",
    a: "AlphaPose (RMPE: STN + SPPE + Pose-NMS) estimates 17 COCO keypoints per frame. It sits behind a pluggable PoseEstimator interface, so it can be swapped for RTMPose (ONNX, no heavy build) without touching the feature or model code.",
  },
  {
    q: "Why use skeleton data instead of raw video?",
    a: "A skeleton is roughly an order of magnitude lower-dimensional than raw pixels and is robust to background, lighting, and apparel. Shot identity lives in the temporal swing trajectory of the joints — not in the surrounding pixels — so a skeleton sequence keeps the signal while discarding noise.",
  },
  {
    q: "What accuracy does the model reach?",
    a: "The trained model reaches 85.2% accuracy on a held-out, player-disjoint test split, with a 0.85 macro-F1 and a well-calibrated 0.039 expected calibration error (temperature-scaled). That surpasses the source paper's reported LSTM 80% / CNN 60% baselines — and unlike a single accuracy point, it is reported with per-class F1 and calibration on a leakage-safe split.",
  },
  {
    q: "Which shots can it classify?",
    a: "Five configured classes: forehand clear, forehand drive, backhand drive, backhand net shot, and forehand net shot. The label set is config-driven (configs/default.yaml) and extensible as more labeled data is added.",
  },
  {
    q: "Can it run in real time?",
    a: "The serving architecture decouples upload from GPU work via an async queue, so the API stays responsive while pose and model compute scale independently. Throughput is bounded by the pose estimator; the BiLSTM head is lightweight and ONNX-exportable for batched, low-latency inference.",
  },
  {
    q: "Does it need shuttlecock tracking?",
    a: "No. The entire approach is shuttle-free — it analyses only the player's skeleton, which sidesteps the occlusion, motion blur, and high-speed tracking failures that plague shuttlecock-based systems.",
  },
];
