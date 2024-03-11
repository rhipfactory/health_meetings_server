const mongoose = require('mongoose');

const eventsSchema = new mongoose.Schema(
  {
    title: {
        type: String
    },
    name: {
      type: String,
    },
    pricing: {
        type: String,
        enum: ['Free', 'Paid'],
        default: 'Free'
    },
    link: {
        type: String,
    },
    summary: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    venue: {
      type: String,
    },
    startDate: {
        type: Date,
        required: true
      },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    image: {

    },    
    agenda: {
        type: String,
    },
    amountGotten: {
      type: Number,
      default: 0,
    },
    speakers: [
      {
        image: String,
        name: String,
        about: String,
      },
    ],
    typeOfEvent: {
      type: String,
      enum: ["inPerson", "Virtual"]
    },
    status: {
      type: String,
      enum: ["Awaiting approval", "Approved", "Disapproved"],
      default: "Awaiting approval",
    },
    _organiser: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    _ticket: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Ticket',
      },
    ],
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Event', eventsSchema);
