// Mock workspace data for the demo application. A real build sources these from
// the FastAPI backend / classification jobs.

export type ClassificationRow = {
  id: string;
  clip: string;
  predicted: string;
  confidence: number;
  status: "complete" | "processing" | "review";
  date: string;
};

export const CLASSIFICATIONS: ClassificationRow[] = [
  { id: "cls_8421", clip: "match_finals_r1.mp4", predicted: "Forehand Clear", confidence: 93.1, status: "complete", date: "2026-06-23" },
  { id: "cls_8420", clip: "training_drive_set2.mov", predicted: "Backhand Drive", confidence: 90.2, status: "complete", date: "2026-06-23" },
  { id: "cls_8419", clip: "net_play_03.mp4", predicted: "Backhand Net Shot", confidence: 88.7, status: "review", date: "2026-06-22" },
  { id: "cls_8418", clip: "rally_clip_77.webm", predicted: "Forehand Drive", confidence: 91.4, status: "complete", date: "2026-06-22" },
  { id: "cls_8417", clip: "warmup_session.mp4", predicted: "Forehand Net Shot", confidence: 87.9, status: "processing", date: "2026-06-21" },
  { id: "cls_8416", clip: "doubles_point_12.mp4", predicted: "Forehand Clear", confidence: 92.4, status: "complete", date: "2026-06-21" },
];

export const CLASS_DISTRIBUTION = [
  { label: "Forehand Clear", value: 34 },
  { label: "Forehand Drive", value: 27 },
  { label: "Backhand Drive", value: 19 },
  { label: "Backhand Net Shot", value: 12 },
  { label: "Forehand Net Shot", value: 8 },
];

export const DASH_STATS = [
  { label: "Clips analyzed", value: "248", delta: "+18 this week", icon: "film" },
  { label: "Avg. confidence", value: "90.6%", delta: "+1.2pts", icon: "gauge" },
  { label: "Classes detected", value: "5 / 5", delta: "full coverage", icon: "layers" },
  { label: "Flagged for review", value: "7", delta: "abstain rate 2.8%", icon: "flag" },
];

export const TEAM = [
  { name: "Jordan Lee", email: "jordan@lab.org", role: "Owner", initials: "JL" },
  { name: "Dr. Priya Menon", email: "priya@lab.org", role: "Analyst", initials: "PM" },
  { name: "Marcus Feld", email: "marcus@club.org", role: "Coach", initials: "MF" },
  { name: "Hao Lin", email: "hao@lab.org", role: "Viewer", initials: "HL" },
];

export const REPORTS = [
  { title: "Weekly performance digest", range: "Jun 16 – Jun 22, 2026", clips: 42, type: "Performance" },
  { title: "Shot-distribution summary", range: "June 2026", clips: 186, type: "Distribution" },
  { title: "Calibration & abstain audit", range: "Q2 2026", clips: 248, type: "Quality" },
];
