const Event = require('../models/event.model');
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const User = require("../models/user.model")
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');
const Payment = require('../models/payment.model')
const Ticket = require('../models/ticket.model')
const Request = require('../models/request.model')
/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all events
 * @route `/api/event/all`
 * @access Public
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
    try {
        const events = await Event.find().populate(['_ticket', '_organiser'])

        // Check if event exist
        if (!events || events.lenth === 0){
            return next(new AppError('Events not found', 404));        
        }

        res.status(200).json({
            success: true,
            length: events.length,
            data: events
        })
    } catch (error) {
        next(new AppError('An error occurred. Please try again.', 500));
    }
})

/**
 * @description Bookmark an event
 * @route `/api/event/bookmark/:eventId`
 * @access Private (only authenticated users can bookmark)
 * @type POST
 */
exports.bookmarkEvent = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const user = req.user._id;

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Add the event to the user's bookmarks
  user.bookmarkedEvents.push(eventId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Event bookmarked successfully',
  });
});

/**
 * @description Get all events created by the logged-in organizer
 * @route `/api/event/myevents`
 * @access Private (requires authentication)
 * @type GET
 */
exports.getEventsByOrganizer = catchAsync(async (req, res, next) => {
  try {
      const organizerId = req.user.id;

      // Find events created by the organizer
      const events = await Event.find({ _organiser: organizerId }).populate(['_ticket', '_organiser']);

      // Check if events exist
      if (!events || events.length === 0) {
          return next(new AppError('Events not found for this organizer', 404));
      }

      res.status(200).json({
          success: true,
          length: events.length,
          data: events
      });
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
* @description Get an event created by the logged-in organizer by ID
* @route `/api/event/my-events/:eventId`
* @access Private (requires authentication)
* @type GET
*/
exports.getEventByOrganizerAndId = catchAsync(async (req, res, next) => {
  try {
      const organizerId = req.user.id;
      const eventId = req.params.eventId;

      // Find the event created by the organizer with the given ID
      const event = await Event.findOne({ _id: eventId, _organiser: organizerId }).populate(['_ticket', '_organiser']);

      // Check if the event exists
      if (!event) {
          return next(new AppError('Event not found for this organizer', 404));
      }

      res.status(200).json({
          success: true,
          data: event
      });
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500));
  }
});



/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get a particular event
 * @route `/api/event/getevent/:id`
 * @access Public
 * @type GET
 */
exports.getOne = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId).populate(["_ticket", "_organiser"]);

    // Check if event exists
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Return the event data
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description make a request for withdrawal
 * @route `/api/event/request`
 * @access Public
 * @type GET
 */
exports.createWithdrawalRequest = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { amount, bankName, accountName, accountNumber } = req.body;

    // Create a new withdrawal request with default status "pending"
    const request = await Request.create({
      _user: userId,
      amount,
      bankName,
      accountName,
      accountNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: request,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get the total amount obtained from an event
 * @route `/api/event/totalAmount/:eventId`
 * @access Public
 * @type GET
 */
exports.getTotalAmountForEvent = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const { filter } = req.query; // The filter query parameter will specify the date range (today, weekly, monthly)

    // console.log(`Received request to get total amount for event ID: ${eventId}, with filter: ${filter}`);

    // Find the event by ID
    const event = await Event.findById(eventId);

    if (!event) {
      // console.log(`Event not found with ID: ${eventId}`);
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // If no filter specified, use the amountGotten field from the event and return
    if (!filter) {
      // console.log(`No filter specified, using amountGotten from the event: ${event.amountGotten}`);
      return res.status(200).json({
        success: true,
        data: {
          totalAmount: event.amountGotten,
        },
      });
    }

    // Filter the tickets based on the date range
    let startDate, endDate;
    if (filter === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (filter === 'weekly') {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start of the week (Monday)
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 }); // End of the week (Sunday)
    } else if (filter === 'monthly') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else {
      // If an invalid filter specified, return an error response
      // console.log(`Invalid filter specified: ${filter}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid filter specified',
      });
    }

    // Calculate the total amount obtained from the event's amountGotten field
    let totalAmount = 0;
    if (event.amountGotten) {
      totalAmount = parseFloat(event.amountGotten);
    }

    // console.log(`Total amount for ${filter} sales: ${totalAmount}`);

    res.status(200).json({
      success: true,
      data: {
        totalAmount,
      },
    });
  } catch (error) {
    // console.error('Error in getTotalAmountForEvent:', error);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all payement received
 * @route `/api/event/getallpayment`
 * @access Public
 * @type GEt
 */
exports.getUserReceivedPayments = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all tickets created by the user
    const userTickets = await Ticket.find({ createdBy: userId }).populate({
      path: '_event',
      select: 'title', // Only select the event title
    });

    // Extract ticket IDs from the user's tickets
    const ticketIds = userTickets.map(ticket => ticket._id);

    // Find all payment records associated with the user's tickets and populate the 'ticket' field
    const payments = await Payment.find({
      ticket: { $in: ticketIds },
    }).populate({
      path: 'ticket',
      populate: {
        path: '_event',
        select: 'title', // Only select the event title
      },
    });

    res.status(200).json({
      success: true,
      length: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getUserReceivedPayments:', error);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


// exports.getTotalAmountFromOrganizerTickets = catchAsync(async (req, res, next) => {
//   try {
//     const userId = req.user._id;

//     // Find all tickets created by the user
//     const userTickets = await Ticket.find({ createdBy: userId });

//     // Calculate the total amount from the user's tickets
//     const totalAmount = userTickets.reduce((total, ticket) => {
//       return total + (ticket.price * ticket.quantity);
//     }, 0);

//     res.status(200).json({
//       success: true,
//       totalAmount,
//     });
//   } catch (error) {
//     console.error('Error in getTotalAmountFromOrganizerTickets:', error);
//     next(new AppError('An error occurred. Please try again.', 500));
//   }
// });


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Create an Event
 * @route `/api/event/create`
 * @access Public
 * @type POST
 */
exports.createEvent = catchAsync(async (req, res, next) => {
  try {
        // Check if the user's account is suspended
    if (req.user.isActive === 'suspended') {
      return next(new AppError('Your account is suspended. Please contact an admin for more inquiries.', 403));
    }
    const {
      title,
      name,
      pricing,
      typeOfEvent,
      link,
      summary,
      state,
      country,
      startDate,
      endDate,
      startTime,
      endTime,
      image,
      agenda,
      venue,
      speakers,
      
    } = req.body;

    // console.log('Received request to create an event.', req.body);

    // Check for required fields
    if (
      !title ||
      !name ||
      !pricing ||
      !typeOfEvent ||
      !link ||
      !summary ||
      !state ||
      !country ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !image ||
      !agenda ||
      !venue ||
      !speakers
    ) {
      // console.log('Missing required fields.');
      
      return res.status(400).json({
        success: false,
        message: "Please fill in all the required fields"
      })
    }

    // Get the authenticated user's ID
    const _organiser = req.user._id;

    const today = new Date();
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);

    // Calculate the number of days until the event
    const daysUntilEvent = Math.ceil(
      (eventStartDate - today) / (1000 * 60 * 60 * 24)
    );

    // Check if the event end date has already passed
    const eventEnded = eventEndDate < today;

    const newEvent = await Event.create({
      title,
      name,
      pricing,
      typeOfEvent,
      link,
      summary,
      state,
      country,
      startDate,
      endDate,
      startTime,
      endTime,
      image,
      agenda,
      _organiser,
      speakers,
      venue,
      daysUntilEvent,
      eventEnded,
      status: "Awaiting approval"
    });

    // Save the event object to the database
    await newEvent.save();

    // Get the user from the database
    const user = await User.findById(_organiser);

    // Add the event's _id to the user's _event array
    user._event.push(newEvent._id);

    // Save the updated user object
    await user.save();

    // console.log('Event created successfully.');

    res.status(200).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: newEvent,
        daysUntilEvent,
        eventEnded,
      },
    });
  } catch (error) {
    // console.log('An error occurred while creating an event:', error);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete an event
 * @route `/api/event/deleteevent/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteEvent = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.id.trim();

      console.log('Attempting to delete event with ID:', eventId);

      // Get the event by ID and delete it
      const event = await Event.findByIdAndDelete(eventId);

      if (!event) {
          console.log('No event found with ID:', eventId);
          return next(new AppError('No event found with that Id', 404));
      }

      console.log('Event deleted:', event);

      res.status(200).json({
          success: true,
          message: 'Event deleted successfully',
          data: {
              user: null
          }
      });
  } catch (error) {
      console.error('Error deleting event:', error);
      next(new AppError('An error occurred. Please try again.', 500));
  }
});

