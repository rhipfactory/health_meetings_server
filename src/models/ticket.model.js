const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    _event: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Event',
    },
    type: {
      type: String
    },
    quantity: {
      type: String
    },
    price: {
      type: String,
    },
    salesStartDate: {
      type: Date,
      required: true
    },
    salesEndDate: {
      type: Date,
      required: true
    },
    salesStartTime: {
      type: String,
      required: true
    },
    salesEndTime: {
      type: String,
      required: true
    },
    paymentRecords: [
      {
        paymentId: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment',
        }],
        amountPaid: {
          type: Number,
          required: true,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
