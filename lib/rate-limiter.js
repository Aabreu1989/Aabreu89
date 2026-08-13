// 🛡️ MIRA SERVERLESS RATE LIMITER
const rateLimitMap = new Map();

export function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

export function isRateLimited(ip, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
        rateLimitMap.set(ip, clientData);
        return false;
    }

    clientData.count += 1;
    rateLimitMap.set(ip, clientData);

    return clientData.count > limit;
}
