const User = require("../models/user.model");
const Organiser = require('../models/organisation-model')
const Event = require('../models/event.model');
const Payment = require('../models/payment.model')
const Ticket = require('../models/ticket.model')
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync");
const Request = require("../models/request.model");

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Ping the Route `test`
 * @route `@any`
 * @access Public
 * @type GET
 */
exports.ping = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Hello from User',
    data: req.body || {}
  });
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Add organization profile
 * @route `/api/user/addorganiser`
 * @access PRIVATE
 * @type PUT
 */
exports.addProfile = catchAsync(async (req, res, next) => {
  const user = req.user._id;
  const { name, email, website, about } = req.body;

  // Check if an Organiser with the same email already exists
  const existingOrganiser = await Organiser.findOne({ email });

  if (existingOrganiser) {
    return res.status(400).json({
      success: false,
      status: 'error',
      message: 'An Organiser with this email already exists.',
    });
  }

  const newOrganiser = new Organiser({
    _user: user,
    name,
    email,
    website,
    about,
  });

  // Save the Organiser to the database
  await newOrganiser.save();

  res.status(201).json({
    success: true,
    status: 'success',
    message: 'Organiser profile created',
    data: newOrganiser,
  });
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get organization profile
 * @route `/api/user/getorganiser`
 * @access PRIVATE
 * @type GET
 */
exports.getOrgan = catchAsync(async (req, res, next) => {
  // Retrieve the Organiser profile by ID
  const user = req.user._id; 

  const organiser = await Organiser.findOne({ _user: user });

  if (!organiser) {
    return res.status(404).json({
      success: false,
      status: 'error',
      message: 'Organiser profile not found.',
    });
  }

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Organiser profile details retrieved',
    data: organiser,
  });
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Edit organization profile
 * @route `/api/user/editorg/:id`
 * @access PRIVATE
 * @type PATCH
 */
exports.editorg = catchAsync(async (req, res, next) => {
  // Check if the user's type is "Organiser"
  // if (req.userType !== 'Organiser') {
  //   return res.status(403).json({
  //     success: false,
  //     status: 'error',
  //     message: 'Only Organisers are allowed to edit profiles.',
  //   });
  // }

  const organiserId = req.params.id;

  // Check if the Organiser profile with the given ID exists
  const organiser = await Organiser.findById(organiserId);

  if (!organiser) {
    return res.status(404).json({
      success: false,
      status: 'error',
      message: 'Organiser profile not found.',
    });
  }

  // Update the Organiser profile details
  const { name, email, website, about } = req.body;

  organiser.name = name;
  organiser.email = email;
  organiser.website = website;
  organiser.about = about;

  // Save the updated Organiser profile
  await organiser.save();

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Organiser profile updated',
    data: organiser,
  });
});
  
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get users profile Controller
 * @route `/api/user/getprofile/:id`
 * @access Private
 * @type GET
 */
exports.getProfile = catchAsync(async (req, res, next) => {
    try {
      // Get the user by id and populate the "_campaign" and "_donation" fields
      const user = await User.findById(req.params.id).populate(['_event', '_ticket']);
  
      // Check if the user exists
      if (!user) {
        return next(new AppError('Profile not found', 404));
      }
  
      // Return the user profile data
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
  });
  

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Edit user profile Controller
 * @route `/api/user/editprofile/:id`
 * @access Private
 * @type PUT
 */
exports.editProfile = catchAsync(async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // Find the user by ID and update the profile
      const user = await User.findByIdAndUpdate(id, updates, { new: true });
  
      // Check if the user exists
      if (!user) {
        return next(new AppError('User not found', 404));
      }
  
      // Save the updated user profile
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
  });
  
  
