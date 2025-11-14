import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs: number = 900000, max: number = 100) => {
  if (process.env.NODE_ENV === 'test') {
    return (req: any, res: any, next: any) => next();
  }
  
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: (req, res) => {
      console.warn(`[RateLimit] Exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    }
  });
};

export const authLimiter = createRateLimiter(15 * 60 * 1000, 10);
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 300);
export const strictLimiter = createRateLimiter(15 * 60 * 1000, 30);
export const commandLimiter = createRateLimiter(1 * 60 * 1000, 50);
