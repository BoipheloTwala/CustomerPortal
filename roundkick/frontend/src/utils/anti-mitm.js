//CODE ATTRIBUTION
//01
//Fetch API for HTTP Requests
//Adapted from: MDN Web Docs. (2025). Fetch API. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Man-in-the-Middle Attack Prevention
//Adapted from: MDN Web Docs. (2025). Manipulator in the Middle (MITM). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Glossary/MitM
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Custom HTTP Security Headers
//Adapted from: OWASP. (2025). Secure Headers Project. [online] OWASP Foundation.
//Available at: https://owasp.org/www-project-secure-headers/
//Date Accessed: 10 October 2025

/**
 * Anti-MITM Protection Utility for Frontend
 * Handles token-based protection to prevent MITM attacks
 */

// Store the security token
/** @type {string | null} */
let securityToken = null;

/**
 * Initialize the security token
 * @param {string | null} initialToken - The initial security token, or null to load from localStorage
 */
export const initializeSecurityToken = (initialToken) => {
  securityToken = initialToken || localStorage.getItem('securityToken');
};

/**
 * Update the security token from response headers
 * @param {Headers} headers - The response headers object
 */
export const updateSecurityToken = (headers) => {
  const newToken = headers.get('X-Security-Token');
  if (newToken) {
    securityToken = newToken;
    localStorage.setItem('securityToken', newToken);
  }
};

/**
 * Add security token to request headers
 * @param {Record<string, string>} [headers={}] - Optional existing headers object
 * @returns {Record<string, string>} Headers object with security token added
 */
export const addSecurityHeaders = (headers = {}) => {
  if (securityToken) {
    headers['X-Security-Token'] = securityToken;
  }
  return headers;
};

/**
 * Enhanced fetch function with anti-MITM protection
 * @param {string} url - The URL to fetch
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<Response>} Promise resolving to the Response
 */
export const secureFetch = async (url, options = {}) => {
  // Add security headers
  const headers = addSecurityHeaders(options.headers || {});
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Update token from response
  updateSecurityToken(response.headers);
  
  // Check for potential MITM indicators
  if (response.status === 403 && response.headers.get('X-Security-Error')) {
    console.error('Potential MITM attack detected!');
    // Clear token and redirect to login
    localStorage.removeItem('securityToken');
    window.location.href = '/login';
    throw new Error('Security error: Potential MITM attack detected');
  }
  
  return response;
};

export default {
  initializeSecurityToken,
  updateSecurityToken,
  addSecurityHeaders,
  secureFetch
};