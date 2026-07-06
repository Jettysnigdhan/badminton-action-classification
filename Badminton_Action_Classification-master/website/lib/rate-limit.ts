import { redis } from "./redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Validates a rate limit using a Sliding Window algorithm backed by Redis.
 *
 * @param key Unique identifier (e.g., 'ratelimit:login:192.168.1.1')
 * @param limit Maximum number of requests in the window
 * @param windowMs Time window in milliseconds
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Atomic Sliding Window using Redis ZSET
  const script = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window_start = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
    local count = redis.call('ZCARD', key)
    
    if count < limit then
      redis.call('ZADD', key, now, now)
      redis.call('PEXPIRE', key, tonumber(ARGV[4]))
      return count + 1
    end
    
    return -1
  `;
  
  try {
    const result = await redis.eval(script, [key], [now, windowStart, limit, windowMs]);
    
    if (result === -1) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: now + windowMs,
      };
    }
    
    return {
      success: true,
      limit,
      remaining: limit - (result as number),
      reset: now + windowMs,
    };
  } catch (error) {
    console.error("[SECURITY] Redis rate limit error:", error);
    // Fail open in case Redis is temporarily down, to not block legitimate users.
    return { success: true, limit, remaining: 1, reset: now + windowMs };
  }
}
