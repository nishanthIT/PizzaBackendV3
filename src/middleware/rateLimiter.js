// Simple in-memory rate limiter
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries
    this.requests.forEach((timestamps, key) => {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    });

    // Check current identifier
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    return true;
  }
}

// Create rate limiter for database operations
const dbRateLimiter = new RateLimiter(50, 60000); // 50 requests per 60 seconds per IP

export const rateLimitMiddleware = (req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress;
  
  if (!dbRateLimiter.isAllowed(identifier)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.',
      retryAfter: 10
    });
  }
  
  next();
};

export default RateLimiter;