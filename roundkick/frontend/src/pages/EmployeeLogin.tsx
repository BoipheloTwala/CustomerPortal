//CODE ATTRIBUTION
//01
//React Hook Form - Form Validation Library
//Adapted from: npm. (2025). react-hook-form. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/react-hook-form
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Yup Schema Validation Library
//Adapted from: npm. (2025). yup. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/yup
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//React Router Navigation
//Adapted from: npm. (2025). react-router-dom. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/react-router-dom
//Date Accessed: 10 October 2025

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiLockClosed, HiMail, HiShieldCheck, HiOfficeBuilding } from 'react-icons/hi';
import { RiBankFill } from 'react-icons/ri';

// Validation schema with RegEx patterns for security
const employeeLoginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

interface EmployeeLoginFormData {
  email: string;
  password: string;
}

const EmployeeLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeLoginFormData>({
    resolver: yupResolver(employeeLoginSchema),
  });

  const onSubmit = async (data: EmployeeLoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data.email, data.password);

      // Enforce admin-only access
      const storedUser = localStorage.getItem('user');
      const role = storedUser ? (JSON.parse(storedUser).role as string) : '';
      if (role !== 'admin') {
        setError('Admin access only. Please use a pre-configured employee account.');
        await logout();
        return;
      }

      navigate('/employee/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <HiOfficeBuilding className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Employee Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            International Payments Administration
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <HiShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Secure Admin Access Only
            </span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="admin@internationalpayments.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="Enter your admin password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in to Admin Portal'
                )}
              </button>
            </div>
          </form>

          {/* Pre-configured Admin Credentials Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <HiShieldCheck className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Pre-configured Admin Accounts
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This portal uses pre-configured admin accounts only.</p>
                  <p className="mt-1">Contact system administrator for access.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link to Customer Portal */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Customer Portal
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiShieldCheck className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a secure administrative portal. All access is logged and monitored.
                  Unauthorized access attempts will be reported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;

