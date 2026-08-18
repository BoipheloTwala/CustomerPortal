//CODE ATTRIBUTION
//01
//React Hook Form - Form Validation Library
//Adapted from: npm. (2025). react-hook-form. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/react-hook-form
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Yup Schema Validation with Regex Patterns
//Adapted from: npm. (2025). yup. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/yup
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//OWASP Password Complexity Requirements
//Adapted from: OWASP. (2025). Authentication Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//React Router Navigation Hooks
//Adapted from: Remix Software. (2025). useNavigate. [online] React Router Documentation.
//Available at: https://reactrouter.com/en/main/hooks/use-navigate
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//TypeScript Form Validation Interfaces
//Adapted from: React TypeScript Cheatsheets. (2025). Forms and Events. [online] GitHub.
//Available at: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events
//Date Accessed: 10 October 2025

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiLockClosed, HiMail, HiShieldCheck, HiUser, HiPhone } from 'react-icons/hi';
import { RiBankFill } from 'react-icons/ri';

// Validation schema with RegEx patterns for security
const registerSchema = yup.object().shape({
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
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .matches(
      /^[a-zA-Z\s\-']+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .matches(
      /^[a-zA-Z\s\-']+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  phoneNumber: yup
    .string()
    .optional()
    .matches(
      /^\+?[1-9]\d{1,14}$/,
      'Please enter a valid phone number (e.g., +1234567890)'
    ),
});

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Main Register Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
              <RiBankFill className="w-7 h-7 text-blue-700 mr-2" />
              Secure Banking
            </h1>
            <p className="text-gray-600 text-sm flex items-center justify-center">
              <HiShieldCheck className="w-4 h-4 text-blue-600 mr-1.5" />
              Open your secure account
            </p>
          </div>

          {/* Notice removed: Customer registration is enabled */}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiMail className="h-4 w-4 text-blue-600 mr-1.5" />
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiUser className="h-4 w-4 text-blue-600 mr-1.5" />
                First Name
              </label>
              <input
                {...register('firstName')}
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.firstName 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiUser className="h-4 w-4 text-blue-600 mr-1.5" />
                Last Name
              </label>
              <input
                {...register('lastName')}
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.lastName 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiPhone className="h-4 w-4 text-blue-600 mr-1.5" />
                Phone Number <span className="ml-1 text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                {...register('phoneNumber')}
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.phoneNumber 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Enter your phone number"
              />
              {errors.phoneNumber && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiLockClosed className="h-4 w-4 text-blue-600 mr-1.5" />
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Create a strong password"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiLockClosed className="h-4 w-4 text-blue-600 mr-1.5" />
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <HiShieldCheck className="w-5 h-5 mr-2" />
                  Open Account
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-700 hover:text-blue-800 transition-colors duration-200"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
