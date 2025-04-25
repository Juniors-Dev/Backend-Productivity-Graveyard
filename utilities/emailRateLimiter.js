const emailRateLimitStore = {}; // in-memory

function isEmailRateLimited(email) {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3;

  if (!emailRateLimitStore[email]) {
    emailRateLimitStore[email] = [];
  }

  // Remove old timestamps
  emailRateLimitStore[email] = emailRateLimitStore[email].filter((ts) => now - ts < window);

  if (emailRateLimitStore[email].length >= maxAttempts) {
    return true;
  }

  // Add current attempt
  emailRateLimitStore[email].push(now);
  return false;
}

module.exports = { isEmailRateLimited };
