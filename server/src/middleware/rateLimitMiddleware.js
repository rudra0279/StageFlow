/**
 * In-Memory Sliding Window Rate Limiter Middleware
 * Protects against brute-force attacks and resource exhaustion.
 */
const rateLimitStores = new Map();

/**
 * Creates a rate limiting middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60,000 = 1 min)
 * @param {number} options.max - Max requests allowed per window (default: 60)
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {string} [options.keyPrefix] - Namespace prefix for this limiter
 * @param {Function} [options.keyGenerator] - Custom key generator function
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests, please try again later.',
  keyPrefix = 'global',
  keyGenerator
}) => {
  const store = new Map();
  rateLimitStores.set(keyPrefix, store);

  // Periodically clean up expired entries (every 2 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.resetTime > windowMs) {
        store.delete(key);
      }
    }
  }, 2 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // In test environment, allow bypassing unless specifically testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const clientKey = keyGenerator
      ? keyGenerator(req)
      : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown-client');

    const fullKey = `${keyPrefix}:${clientKey}`;
    const now = Date.now();

    let record = store.get(fullKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(fullKey, record);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds
      });
    }

    next();
  };
};

// Specialized limiters
export const authLimiter = createRateLimiter({
  keyPrefix: 'auth',
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 1 minute.'
});

export const aiLimiter = createRateLimiter({
  keyPrefix: 'ai',
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI request limit reached. Please wait before generating additional scripts.'
});

export const questionSubmitLimiter = createRateLimiter({
  keyPrefix: 'qa-submit',
  windowMs: 60 * 1000,
  max: 15,
  message: 'Question submission rate exceeded. Please wait a moment before asking another question.'
});

export const questionUpvoteLimiter = createRateLimiter({
  keyPrefix: 'qa-upvote',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Upvote rate exceeded. Please slow down.'
});

export const broadcastLimiter = createRateLimiter({
  keyPrefix: 'broadcast',
  windowMs: 60 * 1000,
  max: 10,
  message: 'Broadcast alert frequency limit reached.'
});
