import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: false, // Will be auto-generated in pre-save hook
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  customerName: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    max: 1000000
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    uppercase: true
  },
  paymentProvider: {
    type: String,
    required: true,
    enum: ['Visa', 'Mastercard', 'Amex', 'Discover']
  },
  recipient: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  swiftCode: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional until verified
        return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v);
      },
      message: 'Invalid SWIFT code format'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function(next) {
  // Always generate paymentId if not set (for new documents)
  if (!this.paymentId && this.isNew) {
    try {
      // Use the model directly to avoid circular reference
      const PaymentModel = this.constructor;
      const count = await PaymentModel.countDocuments();
      this.paymentId = `PAY-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based ID if count fails
      const timestamp = Date.now().toString();
      this.paymentId = `PAY-${timestamp.slice(-8)}`;
    }
  }
  next();
});

// Index for efficient queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;

