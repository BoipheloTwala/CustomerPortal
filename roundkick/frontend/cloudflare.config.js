//CODE ATTRIBUTION
//01
//Cloudflare Pages Deployment
//Adapted from: Cloudflare. (2025). Cloudflare Pages. [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/pages/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Cloudflare DDoS Protection
//Adapted from: Cloudflare. (2025). DDoS Protection. [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/ddos-protection/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Cloudflare Web Application Firewall (WAF)
//Adapted from: Cloudflare. (2025). Web Application Firewall (WAF). [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/waf/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Cloudflare Caching Configuration
//Adapted from: Cloudflare. (2025). Caching. [online] Cloudflare Documentation.
//Available at: https://developers.cloudflare.com/cache/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//OWASP Denial of Service Cheat Sheet
//Adapted from: OWASP. (2025). Denial of Service Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
//Date Accessed: 10 October 2025

/**
 * Cloudflare Configuration for Frontend
 * This file contains settings for Cloudflare integration to protect against DDoS attacks
 */

module.exports = {
  // Cloudflare Pages configuration
  // This can be used when deploying to Cloudflare Pages
  pages: {
    // Enable Cloudflare DDoS protection
    ddosProtection: true,
    // Enable Cloudflare WAF (Web Application Firewall)
    waf: true,
    // Enable Cloudflare caching
    caching: true
  }
};