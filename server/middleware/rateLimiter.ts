import { NextFunction, Request, Response } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface RateLimitOptions {
  windowMs: number; // Duration of window in milliseconds
  max: number; // Max number of requests within window
  message?: string; // Custom message when rate limit reached
}

/**
 * Creates an in-memory sliding-window rate limiting middleware for Express.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please slow down and try again.' } = options;
  const store: RateLimitStore = {};

  // Periodically clean up expired entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const ip in store) {
      if (store[ip].resetTime <= now) {
        delete store[ip];
      }
    }
  }, 120000);

  // Prevent interval from keeping the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier (IP or X-Forwarded-For)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

    const now = Date.now();
    let record = store[ip];

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store[ip] = record;
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds.toString());
      res.status(429).json({
        error: message,
        retryAfter: resetSeconds,
        limit: max,
      });
      return;
    }

    next();
  };
}

// Preset rate limiters for dealership endpoints
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per min
  message: 'General API request limit reached. Please wait before making more requests.',
});

export const refreshRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 sync/refresh requests per min
  message: 'Google Sheets sync limit reached. Please wait a moment before refreshing again.',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI prompt queries per min
  message: 'AI query limit reached. Please wait a moment before asking another question.',
});
