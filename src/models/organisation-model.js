const mongoose = require('mongoose');

const organiserSchema = new mongoose.Schema({
  _user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid Email address',
    ],
  },
  website: {
    type: String,
  },
  about: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Organiser = mongoose.model('Organiser', organiserSchema);

module.exports = Organiser;
