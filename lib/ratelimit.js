import { redis } from './redis.js';

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;
const key = (ip) => 'nova:ratelimit:login:' + ip;

// Fixed window rate-limiting with INCR + EXPIRE, zero extra dependencies
export async function registerAttempt(ip) {
  const r = redis();
  const count = await r.incr(key(ip));
  if (count === 1) await r.expire(key(ip), WINDOW_SECONDS);
  const ttl = await r.ttl(key(ip));
  return {
    allowed: count <= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - count),
    retryAfter: ttl > 0 ? ttl : WINDOW_SECONDS,
  };
}

export async function resetAttempts(ip) {
  await redis().del(key(ip));
}
