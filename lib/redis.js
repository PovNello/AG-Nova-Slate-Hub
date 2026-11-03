import { Redis } from '@upstash/redis';

let client = null;

export function redis() {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Upstash Redis environment variables are missing');
    client = new Redis({ url, token });
  }
  return client;
}
