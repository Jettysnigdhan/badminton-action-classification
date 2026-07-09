import { describe, expect, it, vi } from 'vitest';
import { classifyClipWithFallback } from '../lib/model-inference';

describe('classifyClipWithFallback', () => {
  it('falls back to local inference when the remote model server is unavailable', async () => {
    const clip = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    const localRunner = vi.fn().mockResolvedValue([
      { action: 'Forehand Clear', confidence: 91.2 },
    ]);

    const predictions = await classifyClipWithFallback(
      clip,
      new Map([['forehand_clear', 'Forehand Clear']]),
      (slug) => slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      {
        modelServerUrl: 'http://127.0.0.1:9000',
        fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
        localRunner,
      }
    );

    expect(localRunner).toHaveBeenCalledWith(clip);
    expect(predictions).toEqual([{ action: 'Forehand Clear', confidence: 91.2 }]);
  });
});
