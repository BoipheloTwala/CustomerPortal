//CODE ATTRIBUTION
//01
//OWASP Clickjacking Defense Strategies
//Adapted from: OWASP. (2025). Clickjacking Defense Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//X-Frame-Options HTTP Header
//Adapted from: MDN Web Docs. (2025). X-Frame-Options. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Content Security Policy Frame-Ancestors Directive
//Adapted from: MDN Web Docs. (2025). CSP: frame-ancestors. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Express Rate Limiting Middleware
//Adapted from: npm. (2025). express-rate-limit. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/express-rate-limit
//Date Accessed: 10 October 2025

import { rateLimit } from 'express-rate-limit';

/**
 * Clickjacking Protection Middleware
 * 
 * This middleware provides comprehensive protection against clickjacking attacks
 * by implementing multiple layers of defense:
 * 1. X-Frame-Options header
 * 2. Content Security Policy frame-ancestors directive
 * 3. Frame-busting JavaScript
 * 4. Advanced detection mechanisms
 */

// Rate limiter for clickjacking test endpoint
const clickjackingTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many clickjacking test requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Basic clickjacking protection using X-Frame-Options
 * This is the most basic and widely supported protection
 */
export const clickjackingProtection = (req, res, next) => {
  // Set X-Frame-Options header to prevent framing
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Additional protection for older browsers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

/**
 * Enhanced clickjacking protection with CSP frame-ancestors
 * This provides more granular control than X-Frame-Options
 */
export const enhancedClickjackingProtection = (req, res, next) => {
  // Set X-Frame-Options as fallback for older browsers
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Get existing CSP header or create new one
  const existingCSP = res.getHeader('Content-Security-Policy');
  let cspDirectives = [];
  
  if (existingCSP) {
    // Parse existing CSP
    cspDirectives = existingCSP.split(';').map(directive => directive.trim());
  }
  
  // Add or update frame-ancestors directive
  const frameAncestorsIndex = cspDirectives.findIndex(directive => 
    directive.startsWith('frame-ancestors')
  );
  
  if (frameAncestorsIndex !== -1) {
    // Update existing frame-ancestors directive
    cspDirectives[frameAncestorsIndex] = 'frame-ancestors \'none\'';
  } else {
    // Add new frame-ancestors directive
    cspDirectives.push('frame-ancestors \'none\'');
  }
  
  // Set the updated CSP header
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  next();
};

/**
 * Frame-busting script injection
 * Injects JavaScript code to prevent the page from being framed
 */
export const frameBustingScript = (req, res, next) => {
  // Only inject script for HTML responses
  if (req.accepts('html') && !req.xhr && req.method === 'GET') {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (typeof data === 'string' && data.includes('<html')) {
        // Inject frame-busting script
        const frameBustingScript = `
          <script>
            // Frame-busting script to prevent clickjacking
            (function() {
              if (window !== window.top) {
                // If we're in a frame, try to break out
                try {
                  window.top.location = window.location;
                } catch (e) {
                  // If we can't access parent, show warning
                  document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;display:flex;align-items:center;justify-content:center;font-size:24px;z-index:9999;"><div style="text-align:center;"><h1>Security Warning</h1><p>This page cannot be displayed in a frame for security reasons.</p><p>Please access this page directly.</p></div></div>';
                }
              }
              
              // Additional protection: prevent right-click context menu
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
              });
              
              // Prevent text selection (optional - can be disabled for accessibility)
              document.addEventListener('selectstart', function(e) {
                e.preventDefault();
                return false;
              });
              
              // Log potential clickjacking attempts
              window.addEventListener('beforeunload', function(e) {
                if (window.outerHeight !== window.innerHeight || window.outerWidth !== window.innerWidth) {
                  console.warn('Potential clickjacking attempt detected');
                  // Could send analytics/logging here
                }
              });
            })();
          </script>`;
        
        // Inject the script before closing head tag or at the beginning of body
        if (data.includes('</head>')) {
          data = data.replace('</head>', `${frameBustingScript}</head>`);
        } else if (data.includes('<body')) {
          data = data.replace('<body', `${frameBustingScript}<body`);
        } else {
          // If no head or body tags, inject at the beginning
          data = `${frameBustingScript}${data}`;
        }
      }
      
      originalSend.call(this, data);
    };
  }
  
  next();
};

/**
 * Advanced clickjacking detection
 * Detects potential clickjacking attempts and logs them
 */
export const advancedClickjackingDetection = (req, res, next) => {
  // Check for suspicious headers that might indicate framing attempts
  const suspiciousHeaders = [
    'x-frame-options-bypass',
    'x-frame-bypass',
    'frame-buster-bypass'
  ];
  
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => 
    req.headers[header.toLowerCase()]
  );
  
  if (hasSuspiciousHeaders) {
    console.warn(`Potential clickjacking attempt detected from IP: ${req.ip}`, {
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Block the request
    return res.status(403).json({
      error: 'Access denied',
      message: 'Suspicious request blocked for security reasons'
    });
  }
  
  // Check for referer that might indicate framing
  const referer = req.get('Referer');
  if (referer && !referer.includes(req.get('Host'))) {
    // Log potential framing attempt
    console.info(`Potential framing attempt detected`, {
      referer,
      host: req.get('Host'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Clickjacking protection test endpoint
 * Allows testing of clickjacking protection mechanisms
 */
export const testClickjackingProtection = [
  clickjackingTestLimiter,
  (req, res) => {
    const testType = req.query.type || 'basic';
    
    switch (testType) {
      case 'basic':
        res.json({
          message: 'Clickjacking protection test - Basic',
          protection: {
            xFrameOptions: res.getHeader('X-Frame-Options'),
            csp: res.getHeader('Content-Security-Policy'),
            timestamp: new Date().toISOString()
          },
          instructions: 'Try to frame this response to test protection'
        });
        break;
        
      case 'iframe':
        // Return HTML that can be used to test iframe embedding
        const testHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Clickjacking Protection Test</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .test-result { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
              .success { background: #d4edda; color: #155724; }
              .warning { background: #fff3cd; color: #856404; }
              .error { background: #f8d7da; color: #721c24; }
            </style>
          </head>
          <body>
            <h1>Clickjacking Protection Test</h1>
            <div id="test-results">
              <div class="test-result">
                <h3>Test Status: <span id="status">Running...</span></h3>
                <p>This page should not be embeddable in an iframe if protection is working.</p>
              </div>
            </div>
            
            <script>
              // Test if we're in a frame
              function runTests() {
                const results = document.getElementById('test-results');
                const status = document.getElementById('status');
                
                if (window !== window.top) {
                  status.textContent = 'FAILED';
                  status.className = 'error';
                  results.innerHTML += '<div class="test-result error"><h4>❌ Clickjacking Protection FAILED</h4><p>This page is embedded in a frame!</p></div>';
                  
                  // Try to break out
                  try {
                    window.top.location = window.location;
                  } catch (e) {
                    results.innerHTML += '<div class="test-result warning"><h4>⚠️ Frame-busting blocked</h4><p>The frame-busting script was blocked by the parent frame.</p></div>';
                  }
                } else {
                  status.textContent = 'PASSED';
                  status.className = 'success';
                  results.innerHTML += '<div class="test-result success"><h4>✅ Clickjacking Protection PASSED</h4><p>This page is not embedded in a frame.</p></div>';
                }
                
                // Test headers
                fetch(window.location.href + '?type=basic')
                  .then(response => {
                    const headers = {};
                    response.headers.forEach((value, key) => {
                      headers[key] = value;
                    });
                    
                    if (headers['x-frame-options']) {
                      results.innerHTML += '<div class="test-result success"><h4>✅ X-Frame-Options header present</h4><p>Value: ' + headers['x-frame-options'] + '</p></div>';
                    } else {
                      results.innerHTML += '<div class="test-result warning"><h4>⚠️ X-Frame-Options header missing</h4><p>Consider adding this header for better browser support.</p></div>';
                    }
                    
                    if (headers['content-security-policy'] && headers['content-security-policy'].includes('frame-ancestors')) {
                      results.innerHTML += '<div class="test-result success"><h4>✅ CSP frame-ancestors directive present</h4></div>';
                    } else {
                      results.innerHTML += '<div class="test-result warning"><h4>⚠️ CSP frame-ancestors directive missing</h4><p>Consider adding this for modern browsers.</p></div>';
                    }
                  })
                  .catch(error => {
                    results.innerHTML += '<div class="test-result error"><h4>❌ Header test failed</h4><p>' + error.message + '</p></div>';
                  });
              }
              
              // Run tests when page loads
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', runTests);
              } else {
                runTests();
              }
            </script>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(testHtml);
        break;
        
      case 'headers':
        // Return just the headers for inspection
        const headers = {
          'X-Frame-Options': res.getHeader('X-Frame-Options'),
          'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
          'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
          'X-XSS-Protection': res.getHeader('X-XSS-Protection')
        };
        
        res.json({
          message: 'Clickjacking protection headers',
          headers,
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        res.status(400).json({
          error: 'Invalid test type',
          availableTypes: ['basic', 'iframe', 'headers']
        });
    }
  }
];

/**
 * Middleware to apply all clickjacking protections
 * This combines all protection mechanisms
 */
export const applyClickjackingProtection = [
  clickjackingProtection,
  enhancedClickjackingProtection,
  frameBustingScript,
  advancedClickjackingDetection
];

export default {
  clickjackingProtection,
  enhancedClickjackingProtection,
  frameBustingScript,
  advancedClickjackingDetection,
  testClickjackingProtection,
  applyClickjackingProtection
};
