//CODE ATTRIBUTION
//01
//OWASP Clickjacking Defense Cheat Sheet
//Adapted from: OWASP. (2025). Clickjacking Defense Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Frame-Busting JavaScript Techniques
//Adapted from: Stanford Web Security. (2025). Busting Frame Busting: a Study of Clickjacking Vulnerabilities. [online] Stanford University.
//Available at: https://seclab.stanford.edu/websec/framebusting/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//MutationObserver API for DOM Monitoring
//Adapted from: MDN Web Docs. (2025). MutationObserver. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//TypeScript Classes and Interfaces
//Adapted from: TypeScript. (2025). Classes. [online] TypeScript Documentation.
//Available at: https://www.typescriptlang.org/docs/handbook/2/classes.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//DOM Events - preventDefault and Event Handling
//Adapted from: MDN Web Docs. (2025). Event.preventDefault(). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
//Date Accessed: 10 October 2025

/**
 * Frontend Clickjacking Protection
 * 
 * This module provides client-side clickjacking protection mechanisms
 * to complement the server-side protections.
 */

interface ClickjackingProtectionConfig {
  enableFrameBusting: boolean;
  enableContextMenuProtection: boolean;
  enableSelectionProtection: boolean;
  enableDragProtection: boolean;
  logAttempts: boolean;
  onAttackDetected?: (details: any) => void;
}

const defaultConfig: ClickjackingProtectionConfig = {
  enableFrameBusting: true,
  enableContextMenuProtection: true,
  enableSelectionProtection: false, // Disabled by default for accessibility
  enableDragProtection: true,
  logAttempts: true,
};

class ClickjackingProtection {
  private config: ClickjackingProtectionConfig;
  private isInitialized = false;
  private frameCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ClickjackingProtectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize clickjacking protection
   */
  public init(): void {
    if (this.isInitialized) {
      console.warn('Clickjacking protection already initialized');
      return;
    }

    if (this.config.enableFrameBusting) {
      this.initFrameBusting();
    }

    if (this.config.enableContextMenuProtection) {
      this.initContextMenuProtection();
    }

    if (this.config.enableSelectionProtection) {
      this.initSelectionProtection();
    }

    if (this.config.enableDragProtection) {
      this.initDragProtection();
    }

    this.startFrameMonitoring();
    this.isInitialized = true;

    if (this.config.logAttempts) {
      console.log('Clickjacking protection initialized');
    }
  }

  /**
   * Initialize frame-busting protection
   */
  private initFrameBusting(): void {
    // Check if we're in a frame
    if (window !== window.top) {
      this.handleFrameDetection();
      return;
    }

    // Monitor for frame insertion
    const checkFrame = () => {
      if (window !== window.top) {
        this.handleFrameDetection();
      }
    };

    // Check on load and periodically
    window.addEventListener('load', checkFrame);
    window.addEventListener('focus', checkFrame);
    window.addEventListener('blur', checkFrame);

    // Monitor DOM changes that might indicate framing
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            checkFrame();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Handle frame detection
   */
  private handleFrameDetection(): void {
    const details = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      windowSize: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      },
    };

    if (this.config.logAttempts) {
      console.error('Clickjacking attempt detected:', details);
    }

    if (this.config.onAttackDetected) {
      this.config.onAttackDetected(details);
    }

    // Try to break out of frame
    try {
      // Method 1: Redirect parent window
      window.top!.location = window.location;
    } catch (e) {
      // Method 2: Show warning if we can't break out
      this.showFrameWarning();
    }
  }

  /**
   * Show frame warning
   */
  private showFrameWarning(): void {
    const warningHtml = `
      <div id="clickjacking-warning" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 999999;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1>🚨 Security Warning</h1>
          <p>This page cannot be displayed in a frame for security reasons.</p>
          <p>Please access this page directly by clicking the link below:</p>
          <a href="${window.location.href}" style="color: white; text-decoration: underline;">
            Open in new window
          </a>
        </div>
      </div>
    `;

    document.body.innerHTML = warningHtml;
  }

  /**
   * Initialize context menu protection
   */
  private initContextMenuProtection(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Also prevent context menu on touch devices
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
  }

  /**
   * Initialize selection protection
   */
  private initSelectionProtection(): void {
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Prevent text selection via CSS
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize drag protection
   */
  private initDragProtection(): void {
    // Prevent dragging of images and links
    document.addEventListener('dragstart', (e) => {
      if (e.target instanceof HTMLImageElement || e.target instanceof HTMLAnchorElement) {
        e.preventDefault();
        return false;
      }
    });

    // Prevent dropping
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      return false;
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      return false;
    });
  }

  /**
   * Start frame monitoring
   */
  private startFrameMonitoring(): void {
    this.frameCheckInterval = setInterval(() => {
      // Check if window dimensions indicate potential framing (more conservative check)
      // Only flag if dimensions are exactly equal AND we're not in fullscreen
      const isFullscreen = document.fullscreenElement !== null;
      const dimensionsMatch = window.outerWidth === window.innerWidth && window.outerHeight === window.innerHeight;

      if (dimensionsMatch && !isFullscreen && !this.isInFullscreenMode()) {
        const details = {
          outerWidth: window.outerWidth,
          innerWidth: window.innerWidth,
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight,
          isFullscreen: isFullscreen,
          userAgent: navigator.userAgent
        };
        this.logSuspiciousActivity('Window dimension mismatch detected', details);
      }

      // Check if we're in a frame
      if (window !== window.top) {
        this.handleFrameDetection();
      }
    }, 1000);
  }

  /**
   * Check if we're in fullscreen mode (cross-browser)
   */
  private isInFullscreenMode(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  /**
   * Log suspicious activity
   */
  private logSuspiciousActivity(message: string, details?: any): void {
    if (this.config.logAttempts) {
      console.warn(`Clickjacking protection: ${message}`, details);
    }

    if (this.config.onAttackDetected) {
      this.config.onAttackDetected({
        type: 'suspicious_activity',
        message,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Test clickjacking protection
   */
  public async testProtection(): Promise<{
    isInFrame: boolean;
    frameBustingEnabled: boolean;
    contextMenuBlocked: boolean;
    selectionBlocked: boolean;
    dragBlocked: boolean;
  }> {
    const results = {
      isInFrame: window !== window.top,
      frameBustingEnabled: this.config.enableFrameBusting,
      contextMenuBlocked: false,
      selectionBlocked: false,
      dragBlocked: false,
    };

    // Test context menu blocking
    try {
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
      document.dispatchEvent(contextMenuEvent);
      results.contextMenuBlocked = true;
    } catch (e) {
      results.contextMenuBlocked = true;
    }

    // Test selection blocking
    try {
      const selectionEvent = new Event('selectstart', { bubbles: true });
      document.dispatchEvent(selectionEvent);
      results.selectionBlocked = this.config.enableSelectionProtection;
    } catch (e) {
      results.selectionBlocked = true;
    }

    // Test drag blocking
    try {
      const dragEvent = new DragEvent('dragstart', { bubbles: true });
      document.dispatchEvent(dragEvent);
      results.dragBlocked = true;
    } catch (e) {
      results.dragBlocked = true;
    }

    return results;
  }

  /**
   * Destroy protection and clean up
   */
  public destroy(): void {
    if (this.frameCheckInterval) {
      clearInterval(this.frameCheckInterval);
      this.frameCheckInterval = null;
    }

    this.isInitialized = false;
    console.log('Clickjacking protection destroyed');
  }
}

// Create global instance
const clickjackingProtection = new ClickjackingProtection();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Prevent multiple initializations during development hot reloading
  const initKey = 'clickjacking_initialized';
  if (!(window as any)[initKey]) {
    (window as any)[initKey] = true;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        clickjackingProtection.init();
      });
    } else {
      clickjackingProtection.init();
    }
  }
}

export default clickjackingProtection;
export { ClickjackingProtection };
export type { ClickjackingProtectionConfig };
