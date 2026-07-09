import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { type Prediction } from '@/lib/classifications';

export type ModelInferenceResult = {
  predictions: Prediction[];
  thumbnail?: string | null;
};

export type ModelInferenceOptions = {
  modelServerUrl?: string;
  fetchImpl?: typeof fetch;
  localRunner?: (clip: File) => Promise<Prediction[] | ModelInferenceResult>;
};

function titleCase(slug: string) {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(path.join(current, 'model', 'model.pt')) && existsSync(path.join(current, 'model', 'scripts', 'local_predict.py'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return path.resolve(startDir, '..');
}

function buildPredictions(
  probabilities: Record<string, number>,
  slugToName: Map<string, string>,
  fallbackTitleCase: (slug: string) => string
): Prediction[] {
  return Object.entries(probabilities)
    .map(([slug, p]) => ({
      action: slugToName.get(slug) ?? (fallbackTitleCase(slug) || titleCase(slug)),
      confidence: Math.round(p * 1000) / 10,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function runLocalInference(clip: File): Promise<ModelInferenceResult> {
  const repoRoot = resolveRepoRoot(process.cwd());
  const scriptPath = path.join(repoRoot, 'model', 'scripts', 'local_predict.py');
  if (!existsSync(scriptPath)) {
    throw new Error(`local inference script not found at ${scriptPath}`);
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), 'badminton-classify-'));
  const safeName = (clip.name || 'clip.mp4').replace(/[^\w.\-]+/g, '_');
  const tempPath = path.join(tempDir, safeName);
  writeFileSync(tempPath, Buffer.from(await clip.arrayBuffer()));

  try {
    const pythonExecutable = process.env.PYTHON_PATH || process.env.PYTHON || 'python';
    const env = {
      ...process.env,
      PYTHONPATH: [process.env.PYTHONPATH, path.join(repoRoot, 'model', 'src')].filter(Boolean).join(path.delimiter),
    };
    const result = spawnSync(pythonExecutable, [scriptPath, tempPath], {
      cwd: repoRoot,
      env,
      encoding: 'utf8',
      timeout: 180_000,
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(result.stderr?.trim() || `local inference exited with status ${result.status}`);
    }

    const payload = JSON.parse(result.stdout.trim() || '{}') as { probabilities?: Record<string, number> };
    if (!payload.probabilities) {
      throw new Error('local inference did not return probabilities');
    }
    return { predictions: buildPredictions(payload.probabilities, new Map(), () => '') };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function normalizeInferenceResult(
  result: Prediction[] | ModelInferenceResult,
  slugToName: Map<string, string>,
  fallbackTitleCase: (slug: string) => string
): ModelInferenceResult {
  if (Array.isArray(result)) {
    return { predictions: result };
  }
  return {
    predictions: result.predictions ?? [],
    thumbnail: result.thumbnail ?? null,
  };
}

export async function classifyClipWithFallback(
  clip: File,
  slugToName: Map<string, string>,
  fallbackTitleCase: (slug: string) => string,
  opts: ModelInferenceOptions = {}
): Promise<ModelInferenceResult> {
  const base = (opts.modelServerUrl || process.env.MODEL_SERVER_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (base) {
    try {
      const fd = new FormData();
      fd.append('clip', clip, clip.name);
      const res = await fetchImpl(`${base}/v1/predict/video`, {
        method: 'POST',
        body: fd,
        signal: AbortSignal.timeout(120_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { probabilities?: Record<string, number>; thumbnail?: string | null };
        if (data?.probabilities) {
          return {
            predictions: buildPredictions(data.probabilities, slugToName, fallbackTitleCase),
            thumbnail: data.thumbnail ?? null,
          };
        }
      }
    } catch {
      // Fall through to the local inference path.
    }
  }

  if (opts.localRunner) {
    return opts.localRunner(clip).then((result) => normalizeInferenceResult(result, slugToName, fallbackTitleCase));
  }

  return runLocalInference(clip).then((result) => ({
    predictions: result.predictions,
    thumbnail: result.thumbnail ?? null,
  }));
}
