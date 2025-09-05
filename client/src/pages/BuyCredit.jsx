// Updated BuyCredit.jsx (Fix validation with .trim().length === 0, reset storage, ensure address structure)
import React, { useState, useContext } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const BuyCredit = () => {
  const {
    user,
    backendUrl,
    loadCreditsData,
    token,
    setShowLogin,
    formData,
    updateFormData,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const [localFormData, setLocalFormData] = useState({
    ...formData,
    billingDetails: {
      ...formData.billingDetails,
      address: {
        street: formData.billingDetails.address?.street || "",
        city: formData.billingDetails.address?.city || "",
        state: formData.billingDetails.address?.state || "",
        postalCode: formData.billingDetails.address?.postalCode || "",
        country: formData.billingDetails.address?.country || "",
      },
    },
  });

  const validateUser = async () => {
    if (!token) {
      setShowLogin(true);
      return false;
    }
    try {
      await loadCreditsData();
      return !!user && !!user.name;
    } catch (error) {
      console.error("User validation error:", error);
      setShowLogin(true);
      return false;
    }
  };

  const initPay = async (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Credits Payment",
      description: "Credits Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verify-razor",
            response,
            { headers: { token } }
          );
          if (data.success) {
            loadCreditsData();
            navigate("/");
            toast.success("Credit Added");
          }
        } catch (error) {
          console.error("Payment Verification Error", error);
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const paymentRazorpay = async (transactionId, planId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/pay-razor",
        { planId, transactionId },
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error("Failed to create order");
      }
    } catch (error) {
      console.error("Payment error", error);
      toast.error(error.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("billingDetails.")) {
      const parts = name.split(".");
      if (parts.length === 3) {
        const field = parts[2];
        setLocalFormData((prev) => ({
          ...prev,
          billingDetails: {
            ...prev.billingDetails,
            address: {
              ...prev.billingDetails.address,
              [field]: value,
            },
          },
        }));
      } else {
        const field = parts[1];
        setLocalFormData((prev) => ({
          ...prev,
          billingDetails: { ...prev.billingDetails, [field]: value },
        }));
      }
    } else {
      setLocalFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    const { fullName, email, address } = localFormData.billingDetails;
    if (
      fullName.trim().length === 0 ||
      email.trim().length === 0 ||
      address.street.trim().length === 0 ||
      address.city.trim().length === 0
    ) {
      toast.error("Please fill Full Name, Email, Street, and City to proceed");
      return;
    }
    setFormStep(2);
  };

  const prevStep = () => setFormStep(1);

  const submitForm = async () => {
    const { fullName, email, address } = localFormData.billingDetails;
    if (
      fullName.trim().length === 0 ||
      email.trim().length === 0 ||
      address.street.trim().length === 0 ||
      address.city.trim().length === 0
    ) {
      toast.error("All required fields must be filled");
      return;
    }
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/submit-form",
        { ...localFormData, planId: selectedPlan },
        { headers: { token } }
      );
      updateFormData({
        paymentMethod: localFormData.paymentMethod,
        emiDuration: localFormData.emiDuration,
        billingDetails: localFormData.billingDetails,
      });
      await paymentRazorpay(data.transactionId, selectedPlan);
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-h-[80vh] text-center pt-14 mb-10"
    >
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">
        Our Plans
      </button>
      <h1 className="text-center text-3xl font-medium mb-6 sm:mb-10">
        Choose the plan
      </h1>

      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500"
          >
            <img width={40} src={assets.logo_icon} alt="" />
            <p className="mt-3 mb-1 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">₹{item.price}</span> /{" "}
              {item.credits} credits
            </p>
            <button
              onClick={async () => {
                if (!user) {
                  setShowLogin(true);
                } else {
                  const isValid = await validateUser();
                  if (isValid) {
                    setSelectedPlan(item.id);
                    setFormStep(1);
                    setLocalFormData({
                      ...formData,
                      billingDetails: {
                        ...formData.billingDetails,
                        address: {
                          street: formData.billingDetails.address?.street || "",
                          city: formData.billingDetails.address?.city || "",
                          state: formData.billingDetails.address?.state || "",
                          postalCode:
                            formData.billingDetails.address?.postalCode || "",
                          country:
                            formData.billingDetails.address?.country || "",
                        },
                      },
                    });
                  }
                }
              }}
              className="w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52 cursor-pointer"
            >
              {user ? "Purchase" : "Get Started"}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              Purchase {selectedPlan} Plan
            </h2>
            <p className="mb-4">
              Amount: ₹{plans.find((p) => p.id === selectedPlan)?.price} |
              Credits: {plans.find((p) => p.id === selectedPlan)?.credits}
            </p>
            {formStep === 1 && (
              <div>
                <h3 className="text-xl mb-2">Step 1: Billing Details</h3>
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.fullName"
                  value={localFormData.billingDetails.fullName}
                  onChange={handleFormChange}
                  placeholder="Full Name"
                  required
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.email"
                  value={localFormData.billingDetails.email}
                  onChange={handleFormChange}
                  placeholder="Email"
                  required
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.phone"
                  value={localFormData.billingDetails.phone}
                  onChange={handleFormChange}
                  placeholder="Phone"
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.address.street"
                  value={localFormData.billingDetails.address.street}
                  onChange={handleFormChange}
                  placeholder="Street"
                  required
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.address.city"
                  value={localFormData.billingDetails.address.city}
                  onChange={handleFormChange}
                  placeholder="City"
                  required
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.address.state"
                  value={localFormData.billingDetails.address.state}
                  onChange={handleFormChange}
                  placeholder="State"
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.address.postalCode"
                  value={localFormData.billingDetails.address.postalCode}
                  onChange={handleFormChange}
                  placeholder="Postal Code"
                />
                <input
                  className="w-full p-2 mb-2 border rounded"
                  name="billingDetails.address.country"
                  value={localFormData.billingDetails.address.country}
                  onChange={handleFormChange}
                  placeholder="Country"
                />
                <button
                  className="w-full bg-blue-500 text-white p-2 rounded mt-4"
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            )}
            {formStep === 2 && (
              <div>
                <h3 className="text-xl mb-2">Step 2: Payment Options</h3>
                <select
                  className="w-full p-2 mb-2 border rounded"
                  name="paymentMethod"
                  value={localFormData.paymentMethod}
                  onChange={handleFormChange}
                >
                  <option value="full">Full Payment</option>
                  <option value="emi">EMI</option>
                </select>
                {localFormData.paymentMethod === "emi" && (
                  <select
                    className="w-full p-2 mb-2 border rounded"
                    name="emiDuration"
                    value={localFormData.emiDuration}
                    onChange={handleFormChange}
                  >
                    <option value="0">Select Duration</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                  </select>
                )}
                <p className="mb-2">
                  EMI Amount:{" "}
                  {localFormData.paymentMethod === "emi" &&
                  localFormData.emiDuration
                    ? `₹${(
                        plans.find((p) => p.id === selectedPlan)?.price /
                        localFormData.emiDuration
                      ).toFixed(2)}/month`
                    : "N/A"}
                </p>
                <button
                  className="w-full bg-gray-500 text-white p-2 rounded mr-2"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  className="w-full bg-blue-500 text-white p-2 rounded"
                  onClick={submitForm}
                >
                  Submit
                </button>
              </div>
            )}
            <button
              className="mt-4 text-gray-500 underline"
              onClick={() => {
                setSelectedPlan(null);
                setFormStep(1);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BuyCredit;
