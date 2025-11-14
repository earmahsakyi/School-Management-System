/**
 * Middleware to extract real client IP address
 * Handles proxies, load balancers, and Cloudflare
 */
const getClientIp = (req, res, next) => {
  // Check various headers in order of preference
  let ip = 
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.headers['x-real-ip'] || // Nginx proxy
    req.headers['x-forwarded-for']?.split(',')[0].trim() || // Standard proxy
    req.connection?.remoteAddress || // Direct connection
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'unknown';

  // Clean IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  req.clientIp = ip;
  
  next();
};

module.exports = getClientIp;