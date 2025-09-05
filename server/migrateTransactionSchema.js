import mongoose from 'mongoose';
import transactionModel from './models/transactionModel.js';
import { config } from 'dotenv';
config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error(err));

async function migrateTransactions() {
  try {
    const transactions = await transactionModel.find();
    for (let transaction of transactions) {
      if (!transaction.billingDetails) transaction.billingDetails = { fullName: '', email: '', phone: '', address: {} };
      if (!transaction.paymentMethod) transaction.paymentMethod = 'full';
      if (!transaction.emiDuration) transaction.emiDuration = 0;
      if (!transaction.emiAmount) transaction.emiAmount = 0;
      if (!transaction.razorpayOrderId) transaction.razorpayOrderId = '';
      if (!transaction.paymentStatus) transaction.paymentStatus = 'pending';
      if (!transaction.sheetRowId) transaction.sheetRowId = '';

      await transaction.save();
      console.log(`Updated transaction ${transaction._id}`);
    }
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateTransactions();