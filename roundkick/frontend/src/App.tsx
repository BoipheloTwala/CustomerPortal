//CODE ATTRIBUTION
//01
//React Library and Hooks
//Adapted from: Meta Platforms. (2025). React Documentation. [online] React.
//Available at: https://react.dev/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//React Router v6 - Routing Library
//Adapted from: Remix Software. (2025). React Router. [online] React Router Documentation.
//Available at: https://reactrouter.com/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//React useEffect Hook for Side Effects
//Adapted from: Meta Platforms. (2025). useEffect. [online] React Documentation.
//Available at: https://react.dev/reference/react/useEffect
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//React Router Navigate Component for Redirects
//Adapted from: Remix Software. (2025). Navigate. [online] React Router Documentation.
//Available at: https://reactrouter.com/en/main/components/navigate
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//React Context API for State Management
//Adapted from: Meta Platforms. (2025). Context. [online] React Documentation.
//Available at: https://react.dev/reference/react/createContext
//Date Accessed: 10 October 2025

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import SecurityTest from './pages/SecurityTest';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';
import './App.css';

// Home component that redirects based on auth status
const Home: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admins to employee dashboard, customers to customer dashboard
  return user?.role === 'admin' ? <Navigate to="/employee/dashboard" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
  // Clickjacking protection is auto-initialized by the module

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute requireCustomer={true}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-test"
              element={
                <ProtectedRoute>
                  <SecurityTest />
                </ProtectedRoute>
              }
            />
            {/* Employee Routes */}
            <Route path="/employee/login" element={<EmployeeLogin />} />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
