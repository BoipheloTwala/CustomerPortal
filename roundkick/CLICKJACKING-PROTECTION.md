# Clickjacking Protection Implementation

This document describes the comprehensive clickjacking protection system implemented in the application.

## Overview

Clickjacking is a malicious technique where an attacker tricks a user into clicking on something different from what the user perceives. The application implements multiple layers of protection against clickjacking attacks.

## Protection Mechanisms

### 1. Server-Side Protection

#### X-Frame-Options Header
- **Purpose**: Prevents the page from being embedded in frames
- **Value**: `DENY` - Completely prevents framing
- **Implementation**: Set in `clickjackingProtection` middleware

#### Content Security Policy (CSP)
- **Purpose**: Modern alternative to X-Frame-Options with more granular control
- **Directive**: `frame-ancestors 'none'`
- **Implementation**: Enhanced in `enhancedClickjackingProtection` middleware

#### Frame-Busting Script
- **Purpose**: JavaScript code that attempts to break out of frames
- **Implementation**: Injected into HTML responses via `frameBustingScript` middleware
- **Features**:
  - Detects if page is in a frame
  - Attempts to redirect parent window
  - Shows security warning if breakout fails

#### Advanced Detection
- **Purpose**: Detects suspicious headers and framing attempts
- **Features**:
  - Monitors for bypass headers
  - Logs potential attacks
  - Blocks suspicious requests

### 2. Client-Side Protection

#### Frame Detection
- **Purpose**: Detects if the page is embedded in a frame
- **Implementation**: Continuous monitoring in `clickjacking-protection.ts`
- **Features**:
  - Initial frame check
  - Periodic monitoring
  - DOM mutation observation

#### Context Menu Protection
- **Purpose**: Prevents right-click context menu
- **Implementation**: Event listeners for `contextmenu` events
- **Note**: Can be disabled for accessibility

#### Selection Protection
- **Purpose**: Prevents text selection (optional)
- **Implementation**: CSS and JavaScript event blocking
- **Note**: Disabled by default for accessibility

#### Drag Protection
- **Purpose**: Prevents dragging of images and links
- **Implementation**: Event listeners for drag events

## File Structure

```
backend/
├── middleware/
│   └── clickjacking-protection.js    # Server-side protection middleware
└── server.js                         # Main server with protection enabled

frontend/
├── src/
│   ├── utils/
│   │   └── clickjacking-protection.ts # Client-side protection utility
│   ├── pages/
│   │   └── SecurityTest.tsx          # Security testing page
│   └── App.tsx                       # Main app with protection initialized
```

## Usage

### Server-Side Configuration

The clickjacking protection is automatically enabled in the server:

```javascript
// In server.js
app.use(clickjackingProtection);            // Basic protection
app.use(enhancedClickjackingProtection);    // Enhanced protection
app.use(frameBustingScript);                // Frame-busting script
app.use(advancedClickjackingDetection);     // Advanced detection
```

### Client-Side Configuration

The protection is automatically initialized in the React app:

```typescript
// In App.tsx
import clickjackingProtection from './utils/clickjacking-protection';

useEffect(() => {
  clickjackingProtection.init();
  return () => clickjackingProtection.destroy();
}, []);
```

### Custom Configuration

You can customize the protection behavior:

```typescript
import { ClickjackingProtection } from './utils/clickjacking-protection';

const customProtection = new ClickjackingProtection({
  enableFrameBusting: true,
  enableContextMenuProtection: true,
  enableSelectionProtection: false, // Disabled for accessibility
  enableDragProtection: true,
  logAttempts: true,
  onAttackDetected: (details) => {
    // Custom attack handling
    console.error('Clickjacking attack detected:', details);
  }
});

customProtection.init();
```

## Testing

### Test Endpoints

The application provides several test endpoints:

1. **Basic Test**: `/api/security/clickjacking-test?type=basic`
   - Returns JSON with protection status

2. **Iframe Test**: `/api/security/clickjacking-test?type=iframe`
   - Returns HTML page that tests iframe embedding

3. **Headers Test**: `/api/security/clickjacking-test?type=headers`
   - Returns security headers for inspection

### Frontend Test Page

Access the security test page at `/security-test` to:
- Run comprehensive protection tests
- View protection status
- Test iframe embedding
- Inspect security headers

### Manual Testing

1. **Iframe Test**:
   ```html
   <iframe src="http://localhost:5000/api/security/clickjacking-test?type=iframe"></iframe>
   ```

2. **Context Menu Test**: Try right-clicking on the page

3. **Drag Test**: Try dragging images or links

4. **Selection Test**: Try selecting text (if enabled)

## Security Headers

The application sets the following security headers:

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'; [other directives]
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## Browser Compatibility

### X-Frame-Options
- **Supported**: All modern browsers
- **Fallback**: CSP frame-ancestors for newer browsers

### CSP frame-ancestors
- **Supported**: Modern browsers (Chrome 40+, Firefox 50+, Safari 10+)
- **Fallback**: X-Frame-Options for older browsers

### Frame-Busting Script
- **Supported**: All JavaScript-enabled browsers
- **Limitations**: Can be bypassed by CSP or sandbox attributes

## Best Practices

1. **Use Multiple Layers**: Combine server-side headers with client-side protection
2. **Monitor Attacks**: Log and monitor clickjacking attempts
3. **Regular Testing**: Test protection mechanisms regularly
4. **Keep Updated**: Stay updated with browser security improvements
5. **Accessibility**: Consider accessibility when disabling features

## Known Limitations

1. **CSP Bypass**: Frame-busting can be bypassed with CSP `sandbox` attribute
2. **Browser Extensions**: Some browser extensions may interfere
3. **Accessibility**: Some protection features may impact accessibility
4. **Legacy Browsers**: Limited support in very old browsers

## Troubleshooting

### Protection Not Working

1. Check browser console for errors
2. Verify security headers are present
3. Test with different browsers
4. Check for conflicting middleware

### False Positives

1. Adjust detection sensitivity
2. Whitelist trusted domains
3. Review logging configuration

### Performance Issues

1. Reduce monitoring frequency
2. Optimize event listeners
3. Use efficient DOM observation

## Security Recommendations

1. **Regular Audits**: Regularly audit protection effectiveness
2. **Penetration Testing**: Include clickjacking in security tests
3. **User Education**: Educate users about clickjacking risks
4. **Monitoring**: Monitor for new attack vectors
5. **Updates**: Keep protection mechanisms updated

## Related Security Measures

This clickjacking protection works alongside other security measures:

- **Anti-MITM Protection**: Prevents man-in-the-middle attacks
- **XSS Protection**: Prevents cross-site scripting
- **CSRF Protection**: Prevents cross-site request forgery
- **Rate Limiting**: Prevents abuse and brute force attacks
- **Input Validation**: Prevents injection attacks

## Compliance

The clickjacking protection helps meet security compliance requirements:

- **OWASP Top 10**: Addresses clickjacking vulnerabilities
- **PCI DSS**: Helps meet web application security requirements
- **GDPR**: Protects user data from unauthorized access
- **SOC 2**: Supports security control requirements

## Conclusion

The implemented clickjacking protection provides comprehensive defense against clickjacking attacks through multiple layers of security. Regular testing and monitoring ensure the protection remains effective against evolving threats.
