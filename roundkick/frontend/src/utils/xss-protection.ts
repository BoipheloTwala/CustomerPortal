//CODE ATTRIBUTION
//01
//OWASP Cross-Site Scripting (XSS) Prevention
//Adapted from: OWASP. (2025). Cross Site Scripting Prevention Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Web Crypto API for CSP Nonce Generation
//Adapted from: MDN Web Docs. (2025). Crypto.getRandomValues(). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
//Date Accessed: 10 October 2025

/**
 * Frontend XSS Protection Utilities
 * Provides client-side protection against Cross-Site Scripting attacks
 */

/**
 * Escape HTML entities to prevent XSS
 */
export const escapeHTML = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize text content by removing dangerous patterns
 */
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  // Remove script tags and content
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<applet\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<textarea\b[^>]*>/gi, '')
    .replace(/<select\b[^>]*>/gi, '')
    .replace(/<button\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<style\b[^>]*>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  sanitized = sanitized.replace(/data:application\/javascript/gi, '');
  
  // Remove expression() calls
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  
  return sanitized;
};

/**
 * Validate and sanitize user input
 */
export const validateUserInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  // Check length
  if (input.length > maxLength) {
    throw new Error(`Input too long. Maximum ${maxLength} characters allowed.`);
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new Error('Invalid input: potentially malicious content detected');
    }
  }
  
  return sanitizeText(input);
};

/**
 * Safe innerHTML replacement
 */
export const setSafeInnerHTML = (element: HTMLElement, content: string): void => {
  if (!element) return;
  
  try {
    const sanitized = sanitizeText(content);
    element.textContent = sanitized; // Use textContent instead of innerHTML
  } catch (error) {
    console.error('Error setting safe innerHTML:', error);
    element.textContent = 'Error: Invalid content';
  }
};

/**
 * Safe URL validation
 */
export const validateURL = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  
  // Check for dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'about:'
  ];
  
  const lowerUrl = url.toLowerCase();
  return !dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol));
};

/**
 * Sanitize URL for safe use
 */
export const sanitizeURL = (url: string): string => {
  if (!validateURL(url)) {
    return '#';
  }
  
  // Remove any potential XSS from URL
  return url.replace(/javascript:/gi, '').replace(/vbscript:/gi, '');
};

/**
 * Safe JSON parsing with XSS protection
 */
export const safeJSONParse = (jsonString: string): any => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Recursively sanitize the parsed object
    return sanitizeObject(parsed);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

/**
 * Recursively sanitize objects
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeText(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Content Security Policy helper
 */
export const createCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Safe localStorage operations
 */
export const safeLocalStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const sanitizedKey = sanitizeText(key);
      const sanitizedValue = sanitizeText(value);
      localStorage.setItem(sanitizedKey, sanitizedValue);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const sanitizedKey = sanitizeText(key);
      const value = localStorage.getItem(sanitizedKey);
      return value ? sanitizeText(value) : null;
    } catch (error) {
      console.error('Error getting localStorage:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      const sanitizedKey = sanitizeText(key);
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Error removing localStorage:', error);
    }
  }
};

/**
 * Safe sessionStorage operations
 */
export const safeSessionStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const sanitizedKey = sanitizeText(key);
      const sanitizedValue = sanitizeText(value);
      sessionStorage.setItem(sanitizedKey, sanitizedValue);
    } catch (error) {
      console.error('Error setting sessionStorage:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const sanitizedKey = sanitizeText(key);
      const value = sessionStorage.getItem(sanitizedKey);
      return value ? sanitizeText(value) : null;
    } catch (error) {
      console.error('Error getting sessionStorage:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      const sanitizedKey = sanitizeText(key);
      sessionStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Error removing sessionStorage:', error);
    }
  }
};

/**
 * XSS Protection HOC for React components
 */
export const withXSSProtection = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    // Sanitize props before passing to component
    const sanitizedProps = sanitizeObject(props) as P;
    return React.createElement(Component, sanitizedProps);
  };
};

export default {
  escapeHTML,
  sanitizeText,
  validateUserInput,
  setSafeInnerHTML,
  validateURL,
  sanitizeURL,
  safeJSONParse,
  createCSPNonce,
  safeLocalStorage,
  safeSessionStorage,
  withXSSProtection
};
