const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  ticket: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  }],
  amount: {
    type: Number,
  },
  email: {
    type: String,
  },
  reference: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentDate: {
  type: Date,
  default: Date.now,
},
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;


