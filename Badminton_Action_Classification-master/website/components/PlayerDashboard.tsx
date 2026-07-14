"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

type Classification = {
  id: string;
  filename: string;
  timestamp: number;
  topAction: string;
  confidence: number;
  status: string;
};

type Statistics = {
  total: number;
  avg: number;
  classes: number;
  review: number;
  distribution: Array<{ label: string; value: number }>;
};

function relativeTimeLabel(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlayerDashboard() {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recent" | "stats">("recent");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/player/dashboard");
        if (!res.ok) throw new Error("Could not load dashboard data");
        const data = await res.json();
        if (cancelled) return;

        setClassifications(
          (data.recent ?? []).map((entry: any) => ({
            id: entry.id,
            filename: entry.filename,
            timestamp: entry.timestamp,
            topAction: entry.topAction,
            confidence: entry.confidence,
            status: entry.status,
          })),
        );
        setStats(data.stats ?? null);
      } catch (error) {
        console.error("Failed to load player dashboard", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const actionColors: Record<string, string> = {
    Smash: "from-red-500 to-orange-500",
    Serve: "from-blue-500 to-cyan-500",
    Clear: "from-green-500 to-emerald-500",
    "Net Shot": "from-purple-500 to-pink-500",
    Drop: "from-amber-500 to-yellow-500",
    Drive: "from-indigo-500 to-blue-500",
    Lift: "from-teal-500 to-cyan-500",
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || "from-cyan-500 to-blue-500";
  };

  return (
    <section className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          align="center"
          eyebrow="Your Performance"
          title="Classification History & Stats"
          description="Track your uploaded videos and action classification results"
        />

        <Reveal delay={0.05}>
          <div className="mx-auto mt-14 max-w-4xl">
            {/* Tab Navigation */}
            <div className="mb-8 flex gap-2 rounded-3xl border border-slate-200/80 bg-surface p-1 shadow-card dark:border-slate-700 dark:bg-elevated">
              {['recent', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "recent" | "stats")}
                  className={`flex-1 rounded-3xl px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-ink text-canvas"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {tab === "recent" ? "📹 Recent Uploads" : "📊 Statistics"}
                </button>
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {/* Recent Classifications Tab */}
              {activeTab === "recent" && (
                <motion.div
                  key="recent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                    </div>
                  ) : classifications.length > 0 ? (
                    classifications.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-surface p-5 shadow-card transition-all dark:border-slate-700 dark:bg-elevated"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line/10 bg-elevated text-ink font-bold text-sm shadow-sm">
                                {item.topAction ? item.topAction.charAt(0) : "?"}
                              </div>
                              <div>
                                <h4 className="font-medium text-ink">{item.filename}</h4>
                                <p className="text-sm text-muted">{relativeTimeLabel(item.timestamp)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 text-right">
                            <div className="mb-1 font-semibold text-ink">{item.topAction}</div>
                            <p className="text-xs text-muted">{item.status}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface/50 dark:bg-surface/20">
                                <div
                                  className="h-full bg-accent"
                                  style={{ width: `${item.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted w-12 text-right">{item.confidence.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-line/10 bg-surface p-8 text-center shadow-card dark:border-line/20 dark:bg-elevated">
                      <p className="text-muted">No classifications yet. Upload a video to get started!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Statistics Tab */}
              {activeTab === "stats" && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {isLoading ? (
                    <div className="col-span-2 flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                    </div>
                  ) : stats ? (
                    <>
                      {/* Total Classifications */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-slate-700 dark:bg-elevated"
                      >
                        <div className="text-4xl font-bold text-ink mb-1">{stats.total}</div>
                        <p className="text-sm text-muted">Total Classifications</p>
                        <div className="mt-3 text-xs text-muted">All time</div>
                      </motion.div>

                      {/* Classes detected */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-slate-700 dark:bg-elevated"
                      >
                        <div className="text-4xl font-bold text-ink mb-1">{stats.classes}</div>
                        <p className="text-sm text-muted">Classes detected</p>
                        <div className="mt-3 text-xs text-muted">Unique shot types</div>
                      </motion.div>

                      {/* Average Confidence */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-slate-700 dark:bg-elevated"
                      >
                        <div className="text-4xl font-bold text-ink mb-1">{stats.avg.toFixed(1)}%</div>
                        <p className="text-sm text-muted">Average Confidence</p>
                        <div className="mt-3 text-xs text-muted">Mean model confidence</div>
                      </motion.div>

                      {/* Flagged for review */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-card dark:border-slate-700 dark:bg-elevated"
                      >
                        <div className="text-2xl font-bold text-ink mb-1">{stats.review}</div>
                        <p className="text-sm text-muted">Flagged for review</p>
                        <div className="mt-3 text-xs text-muted">Needs a second look</div>
                      </motion.div>
                    </>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
