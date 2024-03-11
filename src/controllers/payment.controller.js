const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const axios = require('axios');


const initializePayment = async (amount, email, reference, callbackUrl) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amount * 100, // Paystack expects amount in kobo (minimum unit)
        email,
        reference,
        callback_url: callbackUrl, // Adding the callback URL
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Paystack Request Payload:', response);

    return response.data.data.authorization_url;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to verify payment with Paystack";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};


const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentData = response.data.data;
    return paymentData;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to verify payment with Paystack";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

module.exports = {
    initializePayment,
    verifyPayment,
};