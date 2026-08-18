//CODE ATTRIBUTION
//01
//React Hooks and TypeScript
//Adapted from: Meta Platforms. (2025). Hooks. [online] React Documentation.
//Available at: https://react.dev/reference/react
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Tailwind CSS Utility-First Framework
//Adapted from: Tailwind Labs. (2025). Tailwind CSS Documentation. [online] Tailwind CSS.
//Available at: https://tailwindcss.com/docs
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//React Icons Library
//Adapted from: npm. (2025). react-icons. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/react-icons
//Date Accessed: 10 October 2025

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardAPI } from '../services/api';
import { HiUser, HiMail, HiPhone, HiShieldCheck, HiCheckCircle, HiCreditCard, HiChartBar, HiLogout } from 'react-icons/hi';
import { RiBankFill } from 'react-icons/ri';
import { MdAccountBalance, MdSecurity } from 'react-icons/md';
import { Link } from 'react-router-dom';

interface DashboardData {
  message: string;
  features: string[];
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getDashboard();
        setDashboardData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-xl border-b border-blue-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 shadow-lg">
                <RiBankFill className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  Secure Banking
                </h1>
                <p className="text-sm text-blue-200 font-medium">Online Banking Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-2.5 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <HiUser className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white font-semibold">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-5 py-2.5 border border-white/30 text-sm font-semibold rounded-xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <HiLogout className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Welcome Section and Summary Cards Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Welcome Section */}
            <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white flex flex-col justify-center relative overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                  Welcome to your customer dashboard
                </h2>
                <p className="text-blue-100 flex items-center text-lg font-semibold mb-2">
                  <HiShieldCheck className="w-6 h-6 mr-2 text-green-300" />
                  Hello, {user?.firstName}!
                </p>
                <p className="text-blue-200 text-sm font-medium">
                  Your account is secure and ready to use
                </p>
              </div>
            </div>

            {/* Account Summary Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <MdAccountBalance className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-100">Account Status</h3>
                    <p className="text-xl font-bold">{user?.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-200 font-medium">Member since {new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Security Card */}
            {/* <Link to="/security-test" className="block group">
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl hover:border-green-400 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MdSecurity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Security Status</h3>
                      <p className="text-xl font-bold text-gray-900">Protected</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {user?.emailVerified ? 'Email verified' : 'Verification pending'}
                  </p>
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    Click to test security <span className="ml-1">→</span>
                  </p>
                </div>
              </div>
            </Link> */}

            {/* Payments Card - Only for customers */}
            {user?.role === 'customer' && (
              <Link to="/payments" className="block group">
                <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl hover:border-blue-400 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <HiCreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
                        <p className="text-xl font-bold text-gray-900">Make a Payment</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center group-hover:translate-x-1 transition-transform duration-300">
                      Go to payments <span className="ml-1">→</span>
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Profile Completion Card */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-400">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <HiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Profile</h3>
                  <p className="text-xl font-bold text-gray-900">{user?.phoneNumber ? '100%' : '80%'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Complete</p>
            </div>
            </div>
          </div>

          {/* Account Information Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <HiUser className="w-6 h-6 text-blue-600 mr-2" />
              Account Information
            </h3>
            <p className="text-gray-600 mt-1">Your personal and account details</p>
          </div>

          {/* User Profile Information - Individual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Full Name Card */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <HiUser className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Full Name</h3>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            {/* Email Address Card */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <HiMail className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Email Address</h3>
                </div>
                <p className="text-lg font-bold text-gray-900 break-all text-right">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Phone Number Card */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <HiPhone className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Phone Number</h3>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {user?.phoneNumber || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Account Role Card */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-orange-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <HiShieldCheck className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">Account Role</h3>
                </div>
                <span className="inline-flex px-4 py-2.5 text-base font-bold rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize shadow-md">
                  {user?.role}
                </span>
              </div>
            </div>

             {/* Account Status Card */}
             <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                     <HiCheckCircle className="w-6 h-6 text-green-600" />
                   </div>
                   <h3 className="text-sm font-semibold text-gray-700">Account Status</h3>
                 </div>
                 <span className={`inline-flex px-4 py-2.5 text-base font-bold rounded-xl shadow-md ${
                   user?.isActive
                     ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                     : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                 }`}>
                   {user?.isActive ? 'Active' : 'Inactive'}
                 </span>
               </div>
             </div>

            {/* Email Verification Card (if verified) */}
            {user?.emailVerified && (
              <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <MdSecurity className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Email Status</h3>
                  </div>
                  <span className="inline-flex items-center px-4 py-2.5 text-base font-bold rounded-xl bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-md">
                    <HiCheckCircle className="w-5 h-5 mr-2" />
                    Verified
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard Features Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <HiChartBar className="w-6 h-6 text-blue-600 mr-2" />
              Banking Features
            </h3>
            <p className="text-gray-600 mt-1">Explore available banking services</p>
          </div>

          {/* Dashboard Features */}
          {dashboardData && (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {dashboardData.features.map((feature, index) => {
                    const icons = [HiCreditCard, HiChartBar, MdAccountBalance];
                    const Icon = icons[index % icons.length];
                    const isBlue = index % 3 === 0;
                    const isPurple = index % 3 === 1;
                    const isGreen = index % 3 === 2;
                    
                    return (
                      <div
                        key={index}
                        className={`relative bg-gradient-to-br border-2 rounded-3xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group ${
                          isBlue ? 'from-blue-50 to-blue-100 border-blue-300' :
                          isPurple ? 'from-purple-50 to-purple-100 border-purple-300' :
                          'from-green-50 to-green-100 border-green-300'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ${
                            isBlue ? 'bg-blue-100' :
                            isPurple ? 'bg-purple-100' :
                            'bg-green-100'
                          }`}>
                            <Icon className={`w-8 h-8 ${
                              isBlue ? 'text-blue-600' :
                              isPurple ? 'text-purple-600' :
                              'text-green-600'
                            }`} />
                          </div>
                          <div className="text-gray-900 font-bold text-lg mb-3">{feature}</div>
                          <div className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-gray-300 font-semibold shadow-md">
                            Coming Soon
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
