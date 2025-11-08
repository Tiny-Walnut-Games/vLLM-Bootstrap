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
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

export const authLimiter = createRateLimiter(900000, 5);
export const apiLimiter = createRateLimiter(900000, 100);
