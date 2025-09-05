# Full-Stack AI SaaS Application

A **Full-Stack AI SaaS** application that utilizes the **Clipdrop API** to generate images from text prompts. Users can **download** the generated files and manage usage through a **credit-based system**. Credits can be **purchased securely via Razorpay**.

## 🚀 Features

✅ **AI-Powered Image Generation** – Uses **Clipdrop API**  
✅ **Downloadable Outputs** – Users can save generated images  
✅ **Credit-Based System** – Each request consumes credits  
✅ **Secure Payments** – Buy credits using **Razorpay**  
✅ **User Authentication** – Login/signup with **JWT Authentication**  
✅ **Responsive UI** – Built with **Tailwind CSS & Framer Motion**  
✅ **Credit Purchase Form** – Two-step form to submit billing details and payment options  
✅ **Google Sheet Integration** – Automatically appends transaction data to a Google Sheet upon payment completion

---

## 🛠️ Tech Stack

### **Frontend:**

- React.js
- Tailwind CSS
- Framer Motion

### **Backend:**

- Node.js & Express.js
- MongoDB (Mongoose)

### **API & Payment Integration:**

- Clipdrop API (for AI image generation)
- Razorpay (for payments)
- Google Sheets API (for transaction logging)

---

## 🎯 How to Use This Project

### Prerequisites

- **Node.js** and **npm** installed
- MongoDB instance running locally or via a cloud service
- API keys for:
  - **Clipdrop API** (obtain from [Clipdrop](https://clipdrop.co))
  - **Razorpay** (obtain from [Razorpay Dashboard](https://dashboard.razorpay.com))
  - **Google Sheets API** (set up via Google Cloud Console with OAuth 2.0 credentials)

### Setup and Run

1. **Clone the Repository and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

Configure Environment Variables and Start the Application
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=<your-razorpay-key-id>
VITE_RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
CLIPDROP_API_KEY=<your-clipdrop-api-key>
GOOGLE_SHEETS_CREDENTIALS=<your-google-service-account-json>
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>

Start the backend and frontend:
cd backend
npm start
cd ../frontend
npm run dev
