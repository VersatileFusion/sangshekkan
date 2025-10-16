let buckets = new Map();
let redisClient = null;
async function getRedis() {
	if (redisClient) return redisClient;
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (url && token) {
		redisClient = {
			async incr(key, windowSec) {
				const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
				});
				const { result } = await res.json();
				// Set TTL if first increment
				if (result === 1) {
					await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, {
						method: 'POST',
						headers: { Authorization: `Bearer ${token}` },
					});
				}
				return result;
			},
		};
	}
	return redisClient;
}

function getClientIp(request) {
	const xf = request.headers.get('x-forwarded-for');
	if (xf) return xf.split(',')[0].trim();
	const xr = request.headers.get('x-real-ip');
	if (xr) return xr;
	return request.headers.get('cf-connecting-ip') || 'unknown';
}

export async function rateLimit(request, { key = 'default', windowMs = 60_000, limit = 10 } = {}) {
	const ip = getClientIp(request);
	const bucketKey = `${key}:${ip}`;
	const now = Date.now();

	// Try Redis/Upstash shared limiter
	const shared = await getRedis();
	if (shared) {
		const count = await shared.incr(bucketKey, Math.ceil(windowMs / 1000));
		if (count > limit) {
			return { error: Response.json({ error: 'Too Many Requests' }, { status: 429 }) };
		}
		return {};
	}

	// Fallback to in-memory per-instance limiter
	let bucket = buckets.get(bucketKey);
	if (!bucket || now > bucket.resetAt) {
		bucket = { count: 0, resetAt: now + windowMs };
		buckets.set(bucketKey, bucket);
	}
	bucket.count += 1;
	if (bucket.count > limit) {
		const retryAfter = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
		return { error: Response.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } }) };
	}
	return {};
}


