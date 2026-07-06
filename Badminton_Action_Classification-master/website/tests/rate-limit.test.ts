import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '../lib/rate-limit';
import { redis } from '../lib/redis';

vi.mock('../lib/redis', () => ({
  redis: {
    eval: vi.fn(),
  }
}));

describe('Redis Rate Limiter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows request when below limit', async () => {
    vi.mocked(redis.eval).mockResolvedValueOnce(1); // 1 request so far

    const result = await checkRateLimit('test_key', 5, 1000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it('blocks request when at or above limit', async () => {
    vi.mocked(redis.eval).mockResolvedValueOnce(-1); // returns -1 when blocked

    const result = await checkRateLimit('test_key', 5, 1000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(5);
  });

  it('fails open if redis throws an error', async () => {
    vi.mocked(redis.eval).mockRejectedValueOnce(new Error('Redis connection lost'));

    const result = await checkRateLimit('test_key', 5, 1000);
    expect(result.success).toBe(true); // Fails open
    expect(result.remaining).toBe(1);
  });
});
