//CODE ATTRIBUTION
//01
//React Hooks and State Management
//Adapted from: React. (2025). Hooks API Reference. [online] React Documentation.
//Available at: https://react.dev/reference/react/hooks
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Axios HTTP Client
//Adapted from: npm. (2025). axios. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/axios
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//React Router Navigation
//Adapted from: npm. (2025). react-router-dom. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/react-router-dom
//Date Accessed: 10 October 2025

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  HiOfficeBuilding,
  HiUsers,
  HiCreditCard,
  HiChartBar,
  HiLogout,
  HiUserGroup,
  HiCheckCircle,
  HiXCircle,
  HiClock
} from 'react-icons/hi';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Payment {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  currency: string;
  recipient: string;
  paymentProvider: string;
  swiftCode: string;
  status: 'pending' | 'verified' | 'completed' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
  processedAt?: string;
}

interface Stats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    customerUsers: number;
  };
  byRole: Array<{
    _id: string;
    count: number;
    activeCount: number;
    inactiveCount: number;
  }>;
}

interface PaymentStats {
  summary: {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    rejectedPayments: number;
    totalAmountProcessed: number;
  };
}

const EmployeeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiftInputs, setSwiftInputs] = useState<Record<string, string>>({});
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all data in parallel
      const [usersRes, paymentsRes, statsRes, paymentStatsRes] = await Promise.all([
        api.get('/employee/users'),
        api.get('/employee/payments'),
        api.get('/employee/users/stats'),
        api.get('/employee/payments/stats')
      ]);

      setUsers(usersRes.data.users || []);
      setPayments(paymentsRes.data.payments || []);
      setStats(statsRes.data);
      setPaymentStats(paymentStatsRes.data);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      await api.post('/employee/payments/process', { paymentId, action });
      // Reload payments data
      const paymentsRes = await api.get('/employee/payments');
      setPayments(paymentsRes.data.payments || []);
      // Reload stats
      const paymentStatsRes = await api.get('/employee/payments/stats');
      setPaymentStats(paymentStatsRes.data);
    } catch (err: any) {
      setError('Failed to process payment');
      console.error('Payment processing error:', err);
    }
  };

  const pendingPayments = useMemo(() => payments.filter(p => p.status === 'pending' || p.status === 'verified'), [payments]);

  const isValidSwift = (value: string) => {
    const v = (value || '').toUpperCase().trim();
    // SWIFT/BIC: 8 or 11 characters: 4 letters bank, 2 letters country, 2 alnum location, optional 3 alnum branch
    return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v);
  };

  const markVerified = async (paymentId: string) => {
    const swift = (swiftInputs[paymentId] || '').toUpperCase().trim();
    if (!isValidSwift(swift)) {
      setError('Invalid SWIFT code. Please enter a valid 8 or 11 character code.');
      return;
    }
    setError('');
    
    try {
      await api.post('/employee/payments/process', { 
        paymentId, 
        action: 'verify',
        swiftCode: swift
      });
      // Reload payments to get updated status
      await loadDashboardData();
      // Clear the SWIFT input for this payment
      setSwiftInputs(prev => {
        const updated = { ...prev };
        delete updated[paymentId];
        return updated;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify payment');
      console.error('Verify payment error:', err);
    }
  };

  const allPendingVerified = useMemo(() => {
    if (pendingPayments.length === 0) return false;
    // Check if all pending payments are verified (status === 'verified')
    return pendingPayments.every(p => p.status === 'verified');
  }, [pendingPayments]);

  const submitToSwift = async () => {
    if (!allPendingVerified) return;
    setSubmitInProgress(true);
    setSubmitSuccess(false);
    setError('');
    try {
      // Approve all verified pending payments sequentially
      for (const p of pendingPayments) {
        if (p.status === 'verified') {
          await api.post('/employee/payments/process', { paymentId: p.id, action: 'approve' });
        }
      }
      // Reload after submission
      await loadDashboardData();
      setSubmitSuccess(true);
      setVerifiedMap({});
      setSwiftInputs({});
    } catch (err: any) {
      setError('Failed to submit to SWIFT. Please try again.');
      console.error('Submit to SWIFT error:', err);
    } finally {
      setSubmitInProgress(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/employee/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <HiOfficeBuilding className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Employee Portal
                </h1>
                <p className="text-sm text-gray-500">
                  International Payments Administration
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <HiLogout className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiChartBar className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiUsers className="h-5 w-5 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiCreditCard className="h-5 w-5 mr-2" />
              Payment Processing
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HiUsers className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.summary.totalUsers || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HiCheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.summary.activeUsers || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HiCreditCard className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Payments
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {paymentStats?.summary.totalPayments || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HiChartBar className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Processed Amount
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${paymentStats?.summary.totalAmountProcessed.toLocaleString() || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Activity
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Latest user logins and system activity
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {users.slice(0, 5).map((user) => (
                  <li key={user._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <HiUserGroup className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email} • {user.role}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Management
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage customer and admin accounts
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <HiUserGroup className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Role: {user.role} • Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Payment Processing
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Review pending transactions, verify payee details and SWIFT codes, then submit to SWIFT
                </p>
              </div>
              {pendingPayments.length === 0 && (
                <div className="px-4 pb-4 sm:px-6">
                  <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-md">
                    No pending transactions to verify.
                  </div>
                </div>
              )}
              {/* Submit toolbar */}
              <div className="px-4 pb-4 sm:px-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Pending: {pendingPayments.filter(p => p.status === 'pending').length} • Verified: {pendingPayments.filter(p => p.status === 'verified').length}
                </div>
                <button
                  onClick={submitToSwift}
                  disabled={!allPendingVerified || submitInProgress}
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    allPendingVerified && !submitInProgress
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitInProgress ? 'Submitting…' : 'Submit to SWIFT'}
                </button>
              </div>
              {submitSuccess && (
                <div className="mx-4 mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  Submitted to SWIFT. All verified transactions have been forwarded.
                </div>
              )}
              <ul className="divide-y divide-gray-200">
                {payments.map((payment, index) => (
                  <li key={payment.id || `payment-${index}`} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {payment.status === 'completed' && <HiCheckCircle className="h-6 w-6 text-green-400" />}
                            {(payment.status === 'pending' || payment.status === 'verified') && <HiClock className="h-6 w-6 text-yellow-400" />}
                            {payment.status === 'verified' && <HiCheckCircle className="h-6 w-6 text-blue-400" />}
                            {payment.status === 'rejected' && <HiXCircle className="h-6 w-6 text-red-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payment.amount.toLocaleString()} {payment.currency} • {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                            {/* Customer Account Information */}
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-xs font-semibold text-blue-900 mb-2">Customer Account Information</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Name:</span>
                                  <span className="ml-1 font-medium text-gray-900">{payment.customerName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Email:</span>
                                  <span className="ml-1 font-medium text-gray-900">{payment.customerEmail}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="ml-1 font-medium text-gray-900">{payment.customerPhone}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Provider:</span>
                                  <span className="ml-1 font-medium text-gray-900">{payment.paymentProvider}</span>
                                </div>
                              </div>
                            </div>
                            {/* Payment Details */}
                            {(payment.status === 'pending' || payment.status === 'verified') && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Recipient/Payee</label>
                                  <input
                                    className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 cursor-not-allowed"
                                    value={payment.recipient}
                                    readOnly
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">SWIFT / BIC Code</label>
                                  <input
                                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                                      payment.status === 'verified' || payment.swiftCode
                                        ? 'bg-green-50 border-green-300'
                                        : 'bg-white border-gray-300'
                                    }`}
                                    placeholder="e.g. DEUTDEFF or DEUTDEFF500"
                                    value={payment.swiftCode || swiftInputs[payment.id] || ''}
                                    onChange={(e) => setSwiftInputs(prev => ({ ...prev, [payment.id]: e.target.value.toUpperCase() }))}
                                    disabled={payment.status === 'verified'}
                                  />
                                  <p className="mt-1 text-xs text-gray-500">8 or 11 characters</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                        {(payment.status === 'pending' || payment.status === 'verified') && (
                          <div className="flex flex-col space-y-2">
                            {payment.status === 'pending' && (
                              <button
                                onClick={() => markVerified(payment.id)}
                                disabled={!swiftInputs[payment.id] && !payment.swiftCode}
                                className={`inline-flex items-center px-3 py-1 border text-sm leading-4 font-medium rounded-md ${
                                  !swiftInputs[payment.id] && !payment.swiftCode
                                    ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                    : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                Verify
                              </button>
                            )}
                            {payment.status === 'verified' && (
                              <span className="inline-flex items-center px-3 py-1 border text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 border-green-200">
                                ✓ Verified
                              </span>
                            )}
                            <button
                              onClick={() => handlePaymentAction(payment.id, 'reject')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;

