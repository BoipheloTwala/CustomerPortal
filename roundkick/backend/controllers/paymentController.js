import Payment from '../models/Payment.js';
import User from '../models/User.js';

// Create a new payment (customer only)
export const createPayment = async (req, res) => {
  try {
    const { amount, currency, recipient, paymentProvider } = req.body;
    const customerId = req.userId;

    // Get customer information
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create payments' });
    }

    // Create payment
    const payment = new Payment({
      customerId,
      customerEmail: customer.email,
      customerName: {
        firstName: customer.firstName,
        lastName: customer.lastName
      },
      amount,
      currency,
      recipient: recipient.trim(),
      paymentProvider,
      status: 'pending'
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment created successfully',
      payment: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        recipient: payment.recipient,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    // Log the full error for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to create payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

