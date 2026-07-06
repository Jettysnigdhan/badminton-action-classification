import { getDb, newId } from "./db";

export type Prediction = { action: string; confidence: number };

export type ClassificationRow = {
  id: string;
  clip: string;
  predicted: string;
  confidence: number;
  status: string;
  source: string;
  created_at: number;
};

export function recordClassification(opts: {
  userId: string;
  filename: string;
  size: number;
  mime: string;
  predictions: Prediction[];
  source: string;
}): ClassificationRow {
  const db = getDb();
  const now = Date.now();
  const videoId = newId("vid");

  db.prepare(
    "INSERT INTO videos (id, user_id, filename, size, mime, status, created_at) VALUES (?,?,?,?,?,'complete',?)",
  ).run(videoId, opts.userId, opts.filename, opts.size, opts.mime, now);

  const top = opts.predictions[0];
  const id = newId("cls");
  db.prepare(
    `INSERT INTO classifications (id, user_id, video_id, clip, predicted, confidence, probabilities, status, source, created_at)
     VALUES (?,?,?,?,?,?,?,'complete',?,?)`,
  ).run(
    id,
    opts.userId,
    videoId,
    opts.filename,
    top.action,
    top.confidence,
    JSON.stringify(opts.predictions),
    opts.source,
    now,
  );
  return {
    id,
    clip: opts.filename,
    predicted: top.action,
    confidence: top.confidence,
    status: "complete",
    source: opts.source,
    created_at: now,
  };
}

export function enqueueClassification(opts: {
  userId: string;
  filename: string;
  size: number;
  mime: string;
}): { videoId: string; classificationId: string } {
  const db = getDb();
  const now = Date.now();
  const videoId = newId("vid");

  db.prepare(
    "INSERT INTO videos (id, user_id, filename, size, mime, status, created_at) VALUES (?,?,?,?,?,'processing',?)"
  ).run(videoId, opts.userId, opts.filename, opts.size, opts.mime, now);

  const id = newId("cls");
  db.prepare(
    `INSERT INTO classifications (id, user_id, video_id, clip, predicted, confidence, probabilities, status, source, created_at)
     VALUES (?,?,?,?,'',0,'[]','processing','',?)`
  ).run(id, opts.userId, videoId, opts.filename, now);
  
  return { videoId, classificationId: id };
}

export function updateClassification(id: string, opts: {
  predictions: Prediction[];
  source: string;
  status?: string;
}) {
  const db = getDb();
  const top = opts.predictions[0] || { action: "unknown", confidence: 0 };
  
  db.prepare(
    `UPDATE classifications 
     SET predicted = ?, confidence = ?, probabilities = ?, status = ?, source = ?
     WHERE id = ?`
  ).run(
    top.action,
    top.confidence,
    JSON.stringify(opts.predictions),
    opts.status || "complete",
    opts.source,
    id
  );
  
  // also update video status
  const row = db.prepare("SELECT video_id as videoId FROM classifications WHERE id = ?").get(id) as { videoId: string } | undefined;
  if (row?.videoId) {
    db.prepare("UPDATE videos SET status = ? WHERE id = ?").run(opts.status || "complete", row.videoId);
  }
}


export function listClassifications(userId: string, limit = 100): ClassificationRow[] {
  return getDb()
    .prepare(
      "SELECT id, clip, predicted, confidence, status, source, created_at FROM classifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as ClassificationRow[];
}

export function listVideos(userId: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT v.id, v.filename, v.created_at, c.predicted, c.status
       FROM videos v LEFT JOIN classifications c ON c.video_id = v.id
       WHERE v.user_id = ? ORDER BY v.created_at DESC LIMIT ?`,
    )
    .all(userId, limit) as {
    id: string;
    filename: string;
    created_at: number;
    predicted: string | null;
    status: string | null;
  }[];
}

export function dashboardStats(userId: string) {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) c FROM classifications WHERE user_id = ?").get(userId) as { c: number }).c;
  const avg =
    (db
      .prepare("SELECT AVG(confidence) a FROM classifications WHERE user_id = ?")
      .get(userId) as { a: number | null }).a ?? 0;
  const classes = (db
    .prepare("SELECT COUNT(DISTINCT predicted) c FROM classifications WHERE user_id = ?")
    .get(userId) as { c: number }).c;
  const review = (db
    .prepare("SELECT COUNT(*) c FROM classifications WHERE user_id = ? AND status = 'review'")
    .get(userId) as { c: number }).c;

  const distRows = db
    .prepare(
      "SELECT predicted label, COUNT(*) n FROM classifications WHERE user_id = ? GROUP BY predicted ORDER BY n DESC",
    )
    .all(userId) as { label: string; n: number }[];
  const distTotal = distRows.reduce((s, r) => s + r.n, 0) || 1;
  const distribution = distRows.map((r) => ({ label: r.label, value: Math.round((r.n / distTotal) * 100) }));

  return { total, avg, classes, review, distribution };
}
