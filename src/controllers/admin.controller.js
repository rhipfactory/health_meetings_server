const User = require("../models/user.model");
const Event = require('../models/event.model');
const Payment = require('../models/payment.model')
const Ticket = require('../models/ticket.model')
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync");
const Request = require("../models/request.model");
const sendEmail = require('../utils/sendEmail');


/**

 * @description Get all Users Controller
 * @route `/api/admin/getusers`
 *  Private
 * @type GET
 */
exports.getAll = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find().populate(['_ticket', '_event']);

    // Check if users exist
    if (!users || users.length === 0) {
      return next(new AppError('Users not found', 404));
    }

    // Return data of all users
    res.status(200).json({
      success: true,
      len: users.length,
      data: users,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all attendee Controller
 * @route `/api/admin/activities`
 * @access Private
 * @type GET
 */
exports.getAttendee = catchAsync(async (req, res, next) => {
  try {
    const attendees = await User.find({ userType: 'Attendee' }).populate(['_ticket', '_event']);

    // Check if attendees exist
    if (!attendees || attendees.length === 0) {
      return next(new AppError('Attendees not found', 404));
    }

    const attendeesWithDetails = attendees.map(attendee => {
      const totalTickets = attendee._ticket.length;
      const totalAmountSpent = attendee._ticket.reduce((total, ticket) => total + ticket.price, 0);

      return {
        _id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        location: attendee.location,
        createdAt: attendee.createdAt,
        totalTicketsPurchased: totalTickets,
        totalAmountSpentOnTickets: totalAmountSpent,
      };
    });

    // Return data including full details of attendees, purchased tickets, and total amount spent
    res.status(200).json({
      success: true,
      len: attendees.length,
      data: attendeesWithDetails,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all attendee Controller
 * @route `/api/admin/organisers`
 * @access Private
 * @type GET
 */
exports.getOrganisers = catchAsync(async (req, res, next) => {
  try {
    const organisers = await User.find({ userType: 'Organiser' }).populate('_ticket', '_event');

    // Check if organisers exist
    if (!organisers || organisers.length === 0) {
      return next(new AppError('Organisers not found', 404));
    }

    const organisersWithDetails = organisers
      .map(organizer => {
        const { _ticket, _event } = organizer;

        const totalSoldTickets = _ticket.reduce((total, ticket) => {
          if (ticket.quantity === 0) {
            return total + ticket.soldQuantity;
          }
          return total;
        }, 0);

        const totalAmount = _ticket.reduce((total, ticket) => {
          if (ticket.quantity === 0) {
            return total + ticket.price * ticket.soldQuantity;
          }
          return total;
        }, 0);

        const totalEventsCreated = _event.length;

        const lastEvent = _event.reduce((latest, event) => {
          return event.createdAt > latest.createdAt ? event : latest;
        }, { createdAt: new Date(0) });

        const lastCreatedEvent = lastEvent.createdAt > new Date(0) ? lastEvent.name : null;

        return {
          _id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          status: organizer.isActive,
          lastCreatedEvent,
          totalEventsCreated,
          // Include any other user details you want
          totalSoldTickets,
          totalAmount,
          totalEventsCreated,
        };
      });

    // Return data including full details of organisers, total sold tickets, total amount, total events created, and last created event
    res.status(200).json({
      success: true,
      len: organisersWithDetails.length,
      data: organisersWithDetails,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all payments
 * @route `/api/admin/allpayments`
 * @access Private
 * @type GET
 */
exports.getAllPayments = catchAsync(async (req, res, next) => {
    try {
      // Find all payment records
      const payments = await Payment.find().populate('user', 'email').populate('ticket', 'name');
  
      res.status(200).json({
        success: true,
        length: payments.length,
        data: payments,
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
});

  /**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all request
 * @route `/api/admin/requests`
 * @access Private
 * @type GET
 */
exports.getAllReuqest = catchAsync(async (req, res, next) => {
    try {
      // Find all request records
      const request = await Request.find()
  
      res.status(200).json({
        success: true,
        length: request.length,
        data: request,
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
  });

   /**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all request
 * @route `/api/admin/penevent`
 * @access Private
 * @type GET
 */
exports.getTotalPendingEvent = catchAsync(async (req, res, next) => {
  try {
    // Find pending request records
    const pendingRequests = await Event.countDocuments({ status: 'Awaiting approval' });

    res.status(200).json({
      success: true,
      totalPendingEvent: pendingRequests,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all activities Controller
 * @route `/api/admin/activities`
 * @access Private
 * @type GET
 */
exports.getActivities = catchAsync(async (req, res, next) => {
    try {
      const activities = [];
  
      // Retrieve activities for Event
      const eventActivities = await Event.find().sort({ createdAt: -1 });
      activities.push(...eventActivities);
  
      // Retrieve activities for User
      const userActivities = await User.find().sort({ createdAt: -1 });
      activities.push(...userActivities);
  
      // Retrieve activities for Payment
      const paymentActivities = await Payment.find().sort({ createdAt: -1 });
      activities.push(...paymentActivities);
  
      // Shuffle the activities based on the newest sort order
      activities.sort((a, b) => b.createdAt - a.createdAt);
  
      res.status(200).json({
        success: true,
        len: activities.length,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred, please try again.",
      });
    }
  });

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get total number of paid events
 * @route `/api/admin/paid`
 * @access Private
 * @type GET
 */
exports.getTotalPaidEvents = catchAsync(async (req, res, next) => {
  try {
      const paidEventsCount = await Event.countDocuments({ pricing: 'Paid' });

      res.status(200).json({
          success: true,
          totalPaidEvents: paidEventsCount,
      });
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get total number of free events
 * @route `/api/admin/free`
 * @access Private
 * @type GET
 */
exports.getTotalFreeEvents = catchAsync(async (req, res, next) => {
  try {
      const freeEventsCount = await Event.countDocuments({ pricing: 'Free' });

      res.status(200).json({
          success: true,
          totalFreeEvents: freeEventsCount,
      });
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get total amount paid
 * @route `/api/admin/totalamount`
 * @access Private
 * @type GET
 */
exports.getTotalPaidTicketAmount = catchAsync(async (req, res, next) => {
  try {
      const totalPaidAmount = await Payment.aggregate([
          {
              $group: {
                  _id: null,
                  totalAmount: { $sum: "$amount" }
              }
          }
      ]);

      const amount = totalPaidAmount.length > 0 ? totalPaidAmount[0].totalAmount : 0;

      res.status(200).json({
          success: true,
          totalPaidTicketAmount: amount,
      });
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get total sold tickets with quantity 0
 * @route `/api/admin/totalsoldticketsquantityzero`
 * @access Private
 * @type GET
 */
exports.getTotalSoldTicketsQuantityZero = catchAsync(async (req, res, next) => {
  try {
    const totalSoldTickets = await Ticket.countDocuments({ quantity: 0 });

    res.status(200).json({
      success: true,
      totalSold: totalSoldTickets,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description update withdrawal request
 * @route `/api/admin/approve/:requestId`
 * @access Private
 * @type PATCH
 */
exports.updateWithdrawalRequestStatus = catchAsync(async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const { status } = req.body;

    // Find the request by its ID
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Update the request status based on the provided status
    if (status === 'approved' || status === 'rejected') {
      request.status = status;
      await request.save();

      res.status(200).json({
        success: true,
        message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        data: request,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }
  } catch (error) {
    console.error('Error in updateWithdrawalRequestStatus:', error);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Controller to promote user to admin using email
 * @route `/api/admin/new/invite`
 * @access Private
 * @type PATCH
*/
exports.newAdmin = catchAsync(async (req, res, next) => {
  const { name, useremail } = req.body;

  console.log('Received request to create new admin with name:', name);
  console.log('User email:', useremail);

  if (!name || !useremail) {
    console.log('Name and/or user email not provided. Sending 400 response.');
    return res.status(400).json({
      success: false,
      message: 'Please provide both name and user email',
    });
  }

  try {
    // Check if the user with the provided email already exists
    const existingUser = await User.findOne({ email: useremail });

    if (existingUser) {
      console.log('User with this email already exists. Sending 400 response.');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create a new user with the provided name, email, and userType
    const newUser = await User.create({
      name,
      email: useremail,
      userType: 'Admin',
    });
    console.log('Admin user created successfully:', newUser);

    const verificationLink = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/admin/verify/${token}`;
    console.log(`Verification link: ${verificationLink}`);
    console.log(`Sending invitation email to: ${useremail}`);

    const message = `
      Hi there,
      An admin has invited you to become an admin. To verify and finalize your admin status, please click the following link:
      ${verificationLink}`;

    await sendEmail({
      to: useremail,
      subject: 'Admin Invitation',
      message,
    });

    console.log('Invitation email sent successfully!');
    res.status(200).json({
      success: true,
      message: 'Invitation email sent successfully!',
    });
  } catch (err) {
    console.error('Error in newAdmin:', err);
    return res.status(500).json({
      success: false,
      message: "Couldn't send the invitation email",
    });
  }
});




/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Verify Admin acess creating
 * @route `/api/admin/verify/:token`
 * @access Private
 * @type GET
 */
exports.verifyAdminAccess = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  console.log(`Verifying admin access for token: ${token}`);

  const email = tokenStorage[token];

  if (!email) {
    console.log('Invalid token or email not found');
    return res.status(400).json({
      success: false,
      message: 'Invalid token or email not found',
    });
  }

  // Check if the link has expired (10 minutes)
  const tokenCreationTime = parseInt(token, 16);
  const currentTime = Date.now();
  const timeDifference = currentTime - tokenCreationTime;

  const tokenExpirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds

  if (timeDifference > tokenExpirationTime) {
    delete tokenStorage[token];
    console.log('The verification link has expired');
    return res.status(400).json({
      success: false,
      message: 'The verification link has expired',
    });
  }

  // Remove token from temporary storage
  delete tokenStorage[token];

  try {
    // Automatically create an admin user with the specified email
    const newUser = await User.create({
      email,
      userType: 'Admin', // Set user type to "Admin"
      password: 'Welcome', // Set a default password
      otp: null,
    });

    console.log('Admin account created successfully!');
    res.status(200).json({
      success: true,
      message: 'Admin account created successfully!',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    console.error('Error in verifyAdminAccess:', err);
    return res.status(500).json({
      success: false,
      message: "Couldn't create the admin account",
    });
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Approve Event Controller
 * * @route `/api/admin/approve/:eventId`
 * @access Private
 * @type PUT
 */
exports.approveEvent = catchAsync(async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
  
    // Find the Event by ID
    const event = await Event.findById(eventId);
  
    // Check if the Event exists
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
  
    // Check if the event is already approved or disapproved
    if (event.status === 'Approved' || event.status === 'Disapproved') {
      return res.status(400).json({ error: 'Event status cannot be updated' });
    }
  
    // Update the event status based on the provided action
    if (status === 'approve') {
      event.status = 'Approved';
    } else if (status === 'disapproved') {
      event.status = 'Disapproved';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  
    // Save the updated event
    await event.save();
  
    // Save the updated event
    await event.save();
  
    res.status(200).json({
      success: true,
      message: `Event ${status === 'approve' ? 'approved' : 'disapproved'} successfully`,
      data: event,
    });
  } catch (error) {
    return next(new AppError("An error occured, please try again", 500)); 
  }
});


  /**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Suspend a user account a user Controller
 * @route `/api/admin/suspend/:id`
 * @access Private
 * @type PATCH
 */
exports.suspendUser = catchAsync(async (req, res, next) => {
  try {
    // Get the user ID
    const { id } = req.params;

    // Find the user by ID and update the status to "suspended"
    const user = await User.findByIdAndUpdate(id, { status: 'suspended' }, { new: true });

    // Check if the user exists
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    // Return updated user data
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


  /**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a user Controller
 * @route `/api/admin/deleteprofile/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
    try {
      // Get the user ID
      const { id } = req.params;
  
      // Find and delete the user by ID
      const user = await User.findByIdAndDelete(id);
  
      // Check if the user exists
      if (!user) {
        return next(new AppError('No user found with that ID', 404));
      }
  
      // Return data after the user has been deleted
      res.status(200).json({
        success: true,
        data: {
          user: null,
        },
      });
    } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
    }
});