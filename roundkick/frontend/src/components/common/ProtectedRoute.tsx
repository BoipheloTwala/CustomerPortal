//CODE ATTRIBUTION
//01
//React Router Authentication and Protected Routes
//Adapted from: Remix Software. (2025). Authentication. [online] React Router Documentation.
//Available at: https://reactrouter.com/en/main/start/tutorial#authentication
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//React TypeScript Cheatsheet
//Adapted from: React TypeScript Cheatsheets. (2025). React TypeScript Cheatsheets. [online] GitHub.
//Available at: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//OWASP Authentication Best Practices
//Adapted from: OWASP. (2025). Authentication Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireCustomer = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin role if required
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/employee/login" state={{ from: location }} replace />;
  }

  // Check customer role if required (block admins)
  if (requireCustomer && user?.role === 'admin') {
    return <Navigate to="/employee/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
