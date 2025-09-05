import userModel from "../models/userModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import razorpay from 'razorpay';
import transactionModel from "../models/transactionModel.js";
import { google } from 'googleapis';

const sheets = google.sheets('v4');

const registerUser = async (req, res)=>{
  try{
    const {name, email, password} = req.body;

    if(!name || !email || !password){
      return res.json({sucess:false, message: 'Missing Details'})
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userData = {
      name, email, password: hashedPassword
    }  

    const newUser = new userModel(userData);
    const user = await newUser.save()

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

    res.json({success:true, token, user: {name: user.name}})

  }catch(error){
    console.log(error)
    res.json({success: false, message: error.message})
  }
}

const loginUser = async (req, res) =>{
  try{
    const {email, password} = req.body;
    const user = await userModel.findOne({email})

    if(!user){
      return res.json({sucess:false, message: 'User does not exist'})
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(isMatch){
      const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

    res.json({success:true, token, user: {name: user.name}})

    }else{
      return res.json({sucess:false, message: 'Invalid Credentials'})
    }
  }catch(error){
    console.log(error)
    res.json({success: false, message: error.message})
  }
}

const userCredits = async (req, res) =>{
  try{
    const {userId} = req.body

    const user = await userModel.findById(userId)
    res.json({success:true, credits: user.creditBalance, user:{name: user.name}})
  }catch(error){
    console.log(error.message)
    res.json({success: false, message: error.message})
  }
}

const formDataSubmit = async (req, res) => {
  console.log('🚀 formDataSubmit called with body:', req.body); // Log
  try {
    const { userId, planId, paymentMethod, emiDuration, billingDetails } = req.body;
      console.log('📋 Extracted data:', { userId, planId, paymentMethod, billingDetails });//Log

    if (!userId || !planId || !billingDetails?.fullName || !billingDetails?.email) {
      console.log('❌ Validation failed');//Log
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let credits, plan, amount;
    switch (planId) {
      case 'Basic':
        plan = 'Basic'; credits = 100; amount = 10; break;
      case 'Advanced':
        plan = 'Advanced'; credits = 750; amount = 50; break;
      case 'Business':
        plan = 'Business'; credits = 5000; amount = 250; break;
      default:
        console.log('❌ Invalid plan:', planId); //Log
        return res.status(400).json({ success: false, message: 'Invalid plan' });
    }
 console.log('💰 Plan details:', { plan, credits, amount });//
    const emiAmount = paymentMethod === 'emi' && emiDuration ? (amount / emiDuration).toFixed(2) : 0;
    const transactionData = {
      userId,
      planId,
      amount,
      credits,
      paymentMethod: paymentMethod || 'full',
      emiDuration: paymentMethod === 'emi' ? emiDuration : 0,
      emiAmount: paymentMethod === 'emi' ? emiAmount : 0,
      billingDetails: {
        fullName: billingDetails.fullName,
        email: billingDetails.email,
        phone: billingDetails.phone || '',
        address: billingDetails.address || {}
      },
      razorpayOrderId: '', // Filled after payment creation
      paymentStatus: 'pending',
      createdAt: new Date(),
      sheetRowId: '' // Filled after Google Sheets update
    };
    console.log('📄 Transaction data to save:', JSON.stringify(transactionData, null, 2)); // Log

    const newTransaction = await transactionModel.create(transactionData);
        console.log('✅ Transaction created successfully:', newTransaction); // Log

    res.status(200).json({ success: true, transactionId: newTransaction._id });
  } catch (error) {
    console.log('❌ Error in formDataSubmit:', error); // Log
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId, transactionId } = req.body;
    const userData = await userModel.findById(userId);

    if (!userId || !planId || !transactionId) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    const transaction = await transactionModel.findById(transactionId);
    if (!transaction) {
      return res.json({ success: false, message: 'Transaction not found' });
    }

    const options = {
      amount: transaction.amount * 100,
      currency: process.env.CURRENCY || 'INR',
      receipt: transactionId,
    };

    // Use Promise-based Razorpay call
    const order = await razorpayInstance.orders.create(options);
    // Update and save transaction
    transaction.razorpayOrderId = order.id;
    await transaction.save(); // Works here because it's in an async function
    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_EMAIL,
  key: process.env.GOOGLE_SERVICE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === 'paid') {
      const transaction = await transactionModel.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: 'pending' },
        { paymentStatus: 'completed' },
        { new: true }
      );

      if (!transaction) {
        return res.json({ success: false, message: 'Transaction not found or already processed' });
      }

      const userData = await userModel.findById(transaction.userId);
      const creditBalance = (userData.creditBalance || 0) + transaction.credits;
      await userModel.findByIdAndUpdate(userData._id, { creditBalance });

      // Append to Google Sheet
      const sheetValues = [
        transaction.userId.toString(),
        transaction.planId,
        transaction.amount,
        transaction.credits,
        transaction.billingDetails.fullName,
        transaction.billingDetails.email,
        transaction.createdAt.toISOString(),
        transaction.paymentMethod,
        transaction.emiDuration || '',
        transaction.emiAmount || '',
        transaction.razorpayOrderId,
        transaction.paymentStatus
      ];
      const response = await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sheet1!A:L', // Adjust based on your Sheet columns
        valueInputOption: 'RAW',
        resource: { values: [sheetValues] },
      });
      transaction.sheetRowId = response.data.updates.updatedRange.split('!')[1].split(':')[0]; // e.g., 'A10'
      await transaction.save();

      res.json({ success: true, message: 'Credits Added' });
    } else {
      res.json({ success: false, message: 'Payment Failed' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
export {registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, formDataSubmit}