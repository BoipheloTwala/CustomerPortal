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

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { HiCreditCard, HiCurrencyDollar, HiShieldCheck, HiCheckCircle } from 'react-icons/hi';

type PaymentProvider = 'Visa' | 'Mastercard' | 'Amex' | 'Discover';

interface PaymentFormData {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
  provider: PaymentProvider;
  cardNumber: string;
  nameOnCard: string;
  expiry: string; // MM/YY
  cvv: string;
}

const luhnCheck = (value: string): boolean => {
  const sanitized = value.replace(/\s+/g, '');
  if (!/^[0-9]{12,19}$/.test(sanitized)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const paymentSchema: yup.ObjectSchema<PaymentFormData> = yup.object({
  amount: yup.number().typeError('Enter a valid amount').min(0.01, 'Amount must be at least 0.01').max(1000000, 'Amount too large').required('Amount is required'),
  currency: yup.mixed<PaymentFormData['currency']>().oneOf(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'], 'Select a valid currency').required('Currency is required'),
  provider: yup.mixed<PaymentProvider>().oneOf(['Visa', 'Mastercard', 'Amex', 'Discover'], 'Select a valid provider').required('Provider is required'),
  nameOnCard: yup.string().trim().min(2, 'Enter the cardholder name').max(64, 'Name too long').required('Name on card is required'),
  cardNumber: yup
    .string()
    .required('Card number is required')
    .test('digits-only', 'Card number must be 12-19 digits', v => !!v && /^[0-9\s]{12,23}$/.test(v))
    .test('luhn', 'Invalid card number', v => !!v && luhnCheck(v)),
  expiry: yup
    .string()
    .required('Expiry is required')
    .matches(/^(0[1-9]|1[0-2])\/(\d{2})$/, 'Use MM/YY format')
    .test('not-expired', 'Card is expired', v => {
      if (!v) return false;
      const [mm, yy] = v.split('/').map(s => parseInt(s, 10));
      const month = mm;
      const year = 2000 + yy;
      const now = new Date();
      const exp = new Date(year, month, 0, 23, 59, 59);
      return exp >= now;
    }),
  cvv: yup
    .string()
    .required('CVV is required')
    .test('len', 'CVV must be 3 or 4 digits', v => !!v && /^\d{3,4}$/.test(v || '')),
});

const currencies: PaymentFormData['currency'][] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const providers: PaymentProvider[] = ['Visa', 'Mastercard', 'Amex', 'Discover'];

const Payments: React.FC = () => {
  const [submitted, setSubmitted] = useState<{ amount: number; currency: string } | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      currency: 'USD',
      provider: 'Visa',
    }
  });

  const maskedCardPreview = useMemo(() => {
    const cn = (watch('cardNumber') || '').replace(/\s+/g, '');
    if (!cn) return '';
    const last4 = cn.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }, [watch('cardNumber')]);

  const onSubmit = async (data: PaymentFormData) => {
    // Never log or persist sensitive card details
    setError(''); // Clear any previous errors
    try {
      // Submit payment to backend (card details are NOT sent - only payment info)
      await paymentAPI.createPayment({
        amount: data.amount,
        currency: data.currency,
        recipient: data.nameOnCard, // Using name on card as recipient for demo
        paymentProvider: data.provider
      });
      
      setSubmitted({ amount: data.amount, currency: data.currency });
      
      // Clear sensitive fields immediately
      reset({
        amount: undefined as unknown as number,
        currency: data.currency,
        provider: data.provider,
        nameOnCard: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
      });

      // Redirect to dashboard after showing success message for 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Payment submission error:', error);
      setError(error.response?.data?.error || 'Failed to submit payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <HiShieldCheck className="w-7 h-7 text-blue-600 mr-2" />
            Make a Payment
          </h1>
          <p className="text-gray-600 mt-1">Enter payment details below. Your card data is never stored.</p>
        </div>

        {submitted && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
              <HiCheckCircle className="text-white w-4 h-4" />
            </div>
            <div>
              <div className="text-green-800 font-semibold">Payment submitted successfully</div>
              <div className="text-green-700 text-sm">Amount: {submitted.amount.toFixed(2)} {submitted.currency}</div>
              <div className="text-green-600 text-xs mt-1">Your payment is pending verification by our team.</div>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <div className="text-red-800 font-semibold">Payment Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        )}

        <form className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="0.00"
              />
              {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
              <select
                {...register('currency')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
              >
                {currencies.map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
              {errors.currency && <p className="mt-2 text-sm text-red-600">{errors.currency.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Provider</label>
              <select
                {...register('provider')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.provider ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
              >
                {providers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.provider && <p className="mt-2 text-sm text-red-600">{errors.provider.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name on Card</label>
              <input
                type="text"
                autoComplete="cc-name"
                {...register('nameOnCard')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nameOnCard ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="Jane Appleseed"
              />
              {errors.nameOnCard && <p className="mt-2 text-sm text-red-600">{errors.nameOnCard.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <HiCreditCard className="h-4 w-4 text-blue-600 mr-1.5" />
                Card Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                {...register('cardNumber')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cardNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="4111 1111 1111 1111"
              />
              <div className="text-xs text-gray-500 mt-1">{maskedCardPreview}</div>
              {errors.cardNumber && <p className="mt-2 text-sm text-red-600">{errors.cardNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry (MM/YY)</label>
              <input
                type="text"
                autoComplete="cc-exp"
                {...register('expiry')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.expiry ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="MM/YY"
              />
              {errors.expiry && <p className="mt-2 text-sm text-red-600">{errors.expiry.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
              <input
                type="password"
                autoComplete="cc-csc"
                {...register('cvv')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cvv ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="123"
              />
              {errors.cvv && <p className="mt-2 text-sm text-red-600">{errors.cvv.message}</p>}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500 flex items-center">
              <HiCurrencyDollar className="w-4 h-4 mr-1.5 text-blue-600" />
              Secure form. Do not share your card details.
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? 'Processing…' : 'Confirm and Pay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payments;


