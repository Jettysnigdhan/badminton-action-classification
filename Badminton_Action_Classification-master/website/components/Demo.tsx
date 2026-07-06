"use client";

import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "./ui/Section";
import { Reveal } from "./ui/Reveal";

type Status = "idle" | "invalid" | "uploading" | "analyzing" | "done";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

type Prediction = { action: string; confidence: number };

export function Demo() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<Prediction[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Unsupported format — use MP4, MOV, or WebM.";
    if (file.size > MAX_BYTES) return "File exceeds the 50 MB demo limit.";
    if (file.size === 0) return "That file appears to be empty.";
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const v = validate(file);
    if (v) {
      setError(v);
      setStatus("invalid");
      setFileName(null);
      return;
    }
    // Sanitise the displayed name — never render raw user input as HTML.
    const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 64);
    setFileName(safeName);
    setError(null);
    setResults(null);

    try {
      setStatus("uploading");
      
      // 1. Get presigned URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await presignRes.json();

      // 2. Upload directly to MinIO/S3
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload video to storage");

      setStatus("analyzing");

      // 3. Start classification
      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, filename: file.name, size: file.size, mime: file.type }),
      });

      if (!classifyRes.ok) {
        const data = await classifyRes.json().catch(() => ({}));
        throw new Error(data?.error ?? "Classification failed.");
      }
      
      const { jobId, predictions, status: initialStatus } = await classifyRes.json();
      
      if (initialStatus === "processing" && jobId) {
        // Polling loop
        let isDone = false;
        while (!isDone) {
          await new Promise((r) => setTimeout(r, 2000));
          const pollRes = await fetch(`/api/classify/${jobId}`);
          if (!pollRes.ok) throw new Error("Failed to check job status.");
          const pollData = await pollRes.json();
          if (pollData.status === "complete") {
            setResults(pollData.predictions);
            isDone = true;
          } else if (pollData.status === "error") {
            throw new Error("Analysis failed during background processing.");
          }
        }
      } else {
        // Synchronous fallback
        setResults(predictions);
      }
      
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("invalid");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
    setFileName(null);
    setResults(null);
  };

  const busy = status === "uploading" || status === "analyzing";

  return (
    <section id="demo" className="scroll-mt-24 py-24 md:py-32">
      <div className="container-content">
        <SectionHeader
          align="center"
          eyebrow="Live Demo"
          title="Try classification on your own clip"
          description="Drop a short badminton clip to see the pipeline run end to end. Your video is processed through RTMPose skeleton extraction and classified by our trained BiLSTM model in real time."
        />

        <Reveal delay={0.05}>
          <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-3xl border bg-midnight p-2 shadow-card">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-b from-[#0a1726] to-midnight p-6 sm:p-10">
              <div aria-hidden className="absolute inset-0 dot-grid opacity-40" />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver
                    ? "border-cyan bg-cyan/5"
                    : "border-white/15 bg-white/[0.02]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />

                <AnimatePresence mode="wait">
                  {status === "done" && results ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full max-w-md"
                    >
                      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Analysis complete · {fileName}
                      </div>
                      <ul className="space-y-3 text-left">
                        {results.map((p, i) => (
                          <li key={p.action}>
                            <div className="flex items-baseline justify-between text-sm">
                              <span className={`font-medium ${i === 0 ? "text-white" : "text-white/70"}`}>
                                {p.action}
                              </span>
                              <span className="font-mono text-cyan">
                                {p.confidence.toFixed(1)}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-indigo to-cyan"
                                initial={{ width: 0 }}
                                animate={{ width: `${p.confidence}%` }}
                                transition={{ duration: 0.9, delay: i * 0.1 }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={reset}
                        className="mt-6 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
                      >
                        Try another clip
                      </button>
                    </motion.div>
                  ) : busy ? (
                    <motion.div
                      key="busy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative h-14 w-14">
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-cyan/30 border-t-cyan"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <p className="mt-5 font-mono text-sm text-cyan">
                        {status === "uploading" ? "Uploading clip…" : "Extracting skeletons · classifying…"}
                      </p>
                      <p className="mt-1 text-xs text-white/40">{fileName}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-cyan">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
                        </svg>
                      </span>
                      <p className="mt-5 font-display text-lg font-semibold text-white">
                        Drag & drop a badminton clip
                      </p>
                      <p className="mt-1.5 text-sm text-white/45">
                        MP4, MOV or WebM · up to 50 MB
                      </p>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo to-cyan px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                      >
                        Try Classification
                      </button>
                      {error && (
                        <p className="mt-4 text-sm text-red-400" role="alert">
                          {error}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="relative mt-4 text-center font-mono text-[11px] text-white/30">
                Client-side validated · no upload is persisted · real model inference
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
