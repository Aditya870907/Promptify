import express from 'express'
import {registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, formDataSubmit} from '../controllers/userController.js'
import userAuth from '../middleware/auth.js';

const userRouter = express.Router()

userRouter.post('/Register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/credits', userAuth, userCredits);
userRouter.post('/pay-razor', userAuth, paymentRazorpay);
userRouter.post('/verify-razor', verifyRazorpay);
userRouter.post('/submit-form', userAuth, formDataSubmit);

export default userRouter

// http://localhost:4000/api/user/register
// http://localhost:4000/api/user/login
// http://localhost:4000/api/user/credits

// Matercard - 5267 3181 8797 5449
// visa - 4111 1111 1111 1111 - test dummy cv, date, name random