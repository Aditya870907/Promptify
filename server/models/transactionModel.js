import mongoose from 'mongoose';


const billingAddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['full', 'emi'], default: 'full' }, // 'full' or 'emi'
  emiDuration: { type: Number, default: 0 }, // months (if EMI selected)
  emiAmount: { type: Number, default: 0 }, // monthly EMI amount
  billingDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: billingAddressSchema, default: {} }
  },
  razorpayOrderId: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  sheetRowId: { type: String } // for tracking Google Sheets row
});

const transactionModel = mongoose.models.transaction || mongoose.model('transaction', transactionSchema)

export default transactionModel;