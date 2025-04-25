const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// IP-based rate limiting
const ipLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'ip_limiter:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    statusCode: 429,
    data: { result: 'Too many requests from this IP, please try again later.' }
  }
});

// Email-based rate limiting for sensitive operations
const emailLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'email_limiter:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each email to 3 requests per windowMs
  keyGenerator: (req) => {
    return req.body.email || req.params.email;
  },
  message: {
    status: 'error',
    statusCode: 429,
    data: { result: 'Too many requests for this email, please try again later.' }
  }
});

// Specific limiters for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sensitive_limiter:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    statusCode: 429,
    data: { result: 'Too many attempts, please try again later.' }
  }
});

module.exports = {
  ipLimiter,
  emailLimiter,
  sensitiveEndpointsLimiter
}; 