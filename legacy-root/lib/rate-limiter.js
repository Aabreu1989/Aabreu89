/**
 * MIRA API - Minimalist In-Memory Rate Limiter
 * Designed for local development and basic protection.
 * Note: For production on Vercel, a KV (Redis) based solution is recommended.
 */

const rateLimitMap = new Map();

/**
 * @param {string} ip - Client IP address
 * @param {number} limit - Max requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Returns true if the request is within limits
 */
export function isRateLimited(ip, limit = 5, windowMs = 60000) {
    // 🛡️ MIRA SOBERANIA: Bypass local requests (CEO Access)
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
        return false;
    }

    const now = Date.now();
    let userData = rateLimitMap.get(ip);

    // Initial check or reset if window passed
    if (!userData || now > userData.resetTime) {
        userData = { count: 1, resetTime: now + windowMs };
        rateLimitMap.set(ip, userData);
        return false;
    }

    // Only increment if we haven't reached the limit yet
    // This prevents "locking" the user indefinitely with multiple clicks
    if (userData.count <= limit) {
        userData.count++;
        rateLimitMap.set(ip, userData);
    }

    return userData.count > limit;
}

/**
 * Gets client IP from headers
 */
export function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}
