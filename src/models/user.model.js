const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image : [

    ],
    email: {
      type: String,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid Email address',
      ],
      required: true,
    },
    Gender: {
      type: String,
      enum: ['male', 'female'],
    },
    userType: {
      type: String,
      enum: ["Attendee", "Organiser", "Admin"]
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
    },
    passwordConfirm: {
      type: String,
    },
    profileSet: {
      type: Boolean,
      default: false,
    },
    location: {
        type: String,
    },
    specialty: {
        type: String,  
    },
    verificationToken: {
      type: String,  
  },
    _event : [
        {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Event'
      }
     ] ,
     _ticket : [
      {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Ticket'
    }
   ] ,
   bookmarkedEvents: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Event',
    },
  ],
   isActive: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    required: true,
    default: 'inactive',
  },
    verificationToken: {
      type: String
    },
    verificationTokenExpires: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    otp: {
      type: Number,
    }
  },
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

//Compare users password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;



