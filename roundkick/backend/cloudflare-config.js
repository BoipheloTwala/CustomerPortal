//CODE ATTRIBUTION
//01
//Cloudflare IP Ranges
//Adapted from: Cloudflare. (2025). IP Ranges. [online] Cloudflare Documentation.
//Available at: https://www.cloudflare.com/ips/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Cloudflare DDoS Protection
//Adapted from: Cloudflare. (2025). DDoS Protection. [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/ddos-protection/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Cloudflare HTTP Request Headers
//Adapted from: Cloudflare. (2025). HTTP Request Headers. [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Cloudflare as a Reverse Proxy
//Adapted from: Cloudflare. (2025). How Cloudflare Works. [online] Cloudflare Learning Center.
//Available at: https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//DDoS Attack Mitigation Strategies
//Adapted from: OWASP. (2025). Denial of Service Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
//Date Accessed: 10 October 2025

/**
 * Cloudflare Integration Configuration
 * This file contains settings for Cloudflare integration to protect against DDoS attacks
 */

export const cloudflareConfig = {
  // Trusted Cloudflare IP ranges
  // These are the IP ranges that Cloudflare uses for its services
  // Source: https://www.cloudflare.com/ips/
  trustedProxies: [
    // IPv4 ranges
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    // IPv6 ranges
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32'
  ],
  
  // Cloudflare headers to trust
  // These headers are added by Cloudflare and contain information about the original request
  headers: {
    ip: 'CF-Connecting-IP',
    country: 'CF-IPCountry',
    protocol: 'X-Forwarded-Proto'
  },
  
  // DDoS protection settings
  ddosProtection: {
    enabled: true,
    // Rate limiting is already implemented in security.js
    // This is just additional configuration specific to Cloudflare
    challengeMode: 'managed', // Let Cloudflare manage challenges
    securityLevel: 'medium' // Recommended security level
  }
};

// Middleware to handle Cloudflare headers
export const cloudflareMiddleware = (req, res, next) => {
  // Check if request is coming from Cloudflare
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    // If the request has Cloudflare headers, use them
    req.realIp = cfIp;
    req.country = req.headers['cf-ipcountry'];
    req.secureProtocol = req.headers['x-forwarded-proto'] === 'https';
  }
  
  next();
};

// Export the middleware
export default cloudflareMiddleware;