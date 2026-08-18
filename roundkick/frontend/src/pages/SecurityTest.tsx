//CODE ATTRIBUTION
//01
//React Hooks - useState and useEffect
//Adapted from: Meta Platforms. (2025). Hooks API Reference. [online] React Documentation.
//Available at: https://react.dev/reference/react
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Fetch API for HTTP Requests
//Adapted from: MDN Web Docs. (2025). Fetch API. [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//OWASP Clickjacking Testing Guide
//Adapted from: OWASP. (2025). Testing for Clickjacking. [online] OWASP Testing Guide.
//Available at: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/09-Testing_for_Clickjacking
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Window.open() Method
//Adapted from: MDN Web Docs. (2025). Window.open(). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Window/open
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//HTTP Security Headers Testing
//Adapted from: OWASP. (2025). Secure Headers Project. [online] OWASP Foundation.
//Available at: https://owasp.org/www-project-secure-headers/
//Date Accessed: 10 October 2025

import React, { useState, useEffect } from 'react';
import { healthAPI } from '../services/api';
import clickjackingProtection from '../utils/clickjacking-protection';

const SecurityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverResponse, setServerResponse] = useState<any>(null);

  const runClickjackingTests = async () => {
    setIsLoading(true);
    try {
      // Test client-side protection
      const clientResults = await clickjackingProtection.testProtection();
      
      // Test server-side protection
      const serverResponse = await fetch('/api/security/clickjacking-test?type=headers');
      const serverData = await serverResponse.json();
      
      setTestResults({
        client: clientResults,
        server: serverData,
        timestamp: new Date().toISOString()
      });
      
      setServerResponse(serverData);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openIframeTest = () => {
    // Open the iframe test in a new window
    window.open('/api/security/clickjacking-test?type=iframe', '_blank', 'width=800,height=600');
  };

  const openBasicTest = () => {
    // Open the basic test in a new window
    window.open('/api/security/clickjacking-test?type=basic', '_blank', 'width=800,height=600');
  };

  useEffect(() => {
    // Run initial tests
    runClickjackingTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Test Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Client-Side Protection */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Client-Side Protection</h2>
              <div className="space-y-4">
                <button
                  onClick={runClickjackingTests}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Run Client Tests'}
                </button>
                
                <button
                  onClick={openIframeTest}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Test Iframe Protection
                </button>
                
                <button
                  onClick={openBasicTest}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Test Basic Protection
                </button>
              </div>
            </div>

            {/* Server-Side Protection */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">Server-Side Protection</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>X-Frame-Options:</span>
                  <span className={`font-semibold ${
                    serverResponse?.headers?.['x-frame-options'] ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {serverResponse?.headers?.['x-frame-options'] || 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CSP frame-ancestors:</span>
                  <span className={`font-semibold ${
                    serverResponse?.headers?.['content-security-policy']?.includes('frame-ancestors') 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {serverResponse?.headers?.['content-security-policy']?.includes('frame-ancestors') 
                      ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>X-Content-Type-Options:</span>
                  <span className={`font-semibold ${
                    serverResponse?.headers?.['x-content-type-options'] ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {serverResponse?.headers?.['x-content-type-options'] || 'Missing'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Results */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Client-Side Protection</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>In Frame:</span>
                      <span className={`font-semibold ${
                        testResults.client?.isInFrame ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {testResults.client?.isInFrame ? 'Yes (VULNERABLE)' : 'No (Protected)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frame Busting:</span>
                      <span className={`font-semibold ${
                        testResults.client?.frameBustingEnabled ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.client?.frameBustingEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Context Menu Blocked:</span>
                      <span className={`font-semibold ${
                        testResults.client?.contextMenuBlocked ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.client?.contextMenuBlocked ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Selection Blocked:</span>
                      <span className={`font-semibold ${
                        testResults.client?.selectionBlocked ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.client?.selectionBlocked ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Drag Blocked:</span>
                      <span className={`font-semibold ${
                        testResults.client?.dragBlocked ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.client?.dragBlocked ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Server Results */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Server-Side Protection</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>X-Frame-Options:</span>
                      <span className={`font-semibold ${
                        testResults.server?.headers?.['x-frame-options'] ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.server?.headers?.['x-frame-options'] || 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CSP Frame-Ancestors:</span>
                      <span className={`font-semibold ${
                        testResults.server?.headers?.['content-security-policy']?.includes('frame-ancestors') 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.server?.headers?.['content-security-policy']?.includes('frame-ancestors') 
                          ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content-Type Options:</span>
                      <span className={`font-semibold ${
                        testResults.server?.headers?.['x-content-type-options'] ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.server?.headers?.['x-content-type-options'] || 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
            <div className="text-yellow-700 space-y-2">
              <p>1. <strong>Iframe Test:</strong> Click "Test Iframe Protection" to open a test page that tries to embed itself in an iframe.</p>
              <p>2. <strong>Basic Test:</strong> Click "Test Basic Protection" to see the raw server response headers.</p>
              <p>3. <strong>Manual Test:</strong> Try to embed this page in an iframe from another domain to test frame-busting.</p>
              <p>4. <strong>Context Menu:</strong> Try right-clicking on this page - it should be blocked.</p>
              <p>5. <strong>Drag Test:</strong> Try dragging images or links - it should be blocked.</p>
            </div>
          </div>

          {/* Security Status */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Clickjacking Protection Active</span>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {testResults?.timestamp || 'Never'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTest;
