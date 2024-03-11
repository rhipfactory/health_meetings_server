const Event = require('../models/event.model');
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const Ticket = require('../models/ticket.model')
const {initializePayment, verifyPayment} = require('../controllers/payment.controller')
const Payment = require('../models/payment.model')
const sendEmail = require('../utils/sendEmail');
const User = require('../models/user.model')
const { v4: uuidv4 } = require('uuid');


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get all tickets
 * @route `/api/ticket/all`
 * @access Public
 * @type GET
 */
exports.getAll = catchAsync(async(req, res, next)=>{
    try {
        const tick = await Ticket.find().populate('_event')

        // Check if the ticket exist
        if (!tick || tick.lenth === 0){
            return next(new AppError('Ticket not found', 404));        
        }

        res.status(200).json({
            success: true,
            length: tick.length,
            data: tick
        })
    } catch (error) {
        next(new AppError('An error occurred. Please try again.', 500));
    }
})

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get a particular ticket
 * @route `/api/ticket/getticket/:id`
 * @access PRIVATE
 * @type GET
 */
exports.getOne = catchAsync(async(req, res, next)=>{
  try {
      const tick = await Ticket.findById(req.params.id).populate('_event')

      // Check if the ticket exist
      if(!tick || tick.length === 0) {
        return next(new AppError('Ticket not found', 404));
      }

    // Return the ticket data
      res.status(200).json({
          success: true,
          data: tick
      })
  } catch (error) {
      next(new AppError('An error occurred. Please try again.', 500)); 
  }

})


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get purchased ticket by a user
 * @route `/api/ticket/allpaid`
 * @access PRIVATE
 * @type GET
 */
exports.getUserTickets = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all tickets purchased by the user and populate the '_event' field with specific fields
    const tickets = await Ticket.find({ purchasedBy: userId }).populate({
      path: "_event",
      select: "title name summary startDate endDate startTime endTime image country pricing"
    });

    res.status(200).json({
      success: true,
      data: {
        tickets: tickets,
      },
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get a purchased ticket by a user
 * @route `/api/ticket/paid/:ticketId`
 * @access PRIVATE
 * @type GET
 */
exports.getUserTicket = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { ticketId } = req.params;

    // Find the specific ticket purchased by the user and populate the '_event' field with specific fields
    const ticket = await Ticket.findOne({ _id: ticketId, purchasedBy: userId }).populate({
      path: "_event",
      select: "title name summary startDate endDate startTime endTime image country pricing"
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        ticket: ticket,
      },
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});




/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Create a ticket
 * @route `/api/ticket/create/:eventId`
 * @access PRIVATE
 * @type POST
 */
exports.createTicket = catchAsync(async (req, res, next) => {
  try {
    const { tickets } = req.body;
    const eventId = req.params.eventId;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if the event's pricing field is "paid" or "free"
    const eventPricing = event.pricing;
    const isFreeEvent = eventPricing === 'Free';

    // Array to store the created tickets
    const createdTickets = [];

    // Iterate over the tickets array and create tickets
    for (const ticketData of tickets) {
      const { quantity, salesStartDate, salesEndDate, salesStartTime, salesEndTime, price, type } = ticketData;

      // Check if the event is paid and trying to create a free ticket or vice versa
      if ((isFreeEvent && price !== undefined || null) || (!isFreeEvent && price === undefined || null)) {
        return next(new AppError(`Invalid ticket data for ${isFreeEvent ? 'free' : 'paid'} ticket.`, 400));
      }

      // Create a new ticket
      const ticket = new Ticket({
        _event: event._id,
        price,
        type,
        quantity,
        salesStartDate,
        salesEndDate,
        salesStartTime,
        salesEndTime,
      });

      // Save the ticket to the database
      await ticket.save();

      // Add the ticket's ID to the event's _ticket array
      event._ticket.push(ticket._id);

      // Add the ticket to the createdTickets array
      createdTickets.push(ticket);
    }

    // Save the updated event object
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Tickets created successfully',
      data: createdTickets,
    });

  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Pay for ticket
 * @route `/api/ticket/create`
 * @access Private
 * @type POST
 */

exports.payTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  let { quantity, email } = req.body;

  try {
    // Convert quantity to a number if it's a string
    if (typeof quantity === 'string') {
      quantity = parseFloat(quantity);
      if (isNaN(quantity)) {
        throw new Error('Invalid quantity');
      }
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if the requested quantity is available
    if (ticket.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient tickets available for purchase',
      });
    }

    // Calculate the total amount based on the ticket price and quantity
    const totalAmount = Number(ticket.price * quantity);

    // Create a unique reference for the payment
    const reference = uuidv4(); // Using UUID version 4 for unique reference

    // Create a payment record in the database with the unique reference
    const payment = new Payment({ user: req.user._id, ticket: ticketId, amount: totalAmount, reference });
    await payment.save();

    // Update the ticket paymentRecords array with the new payment details
    ticket.paymentRecords.push({
      paymentId: payment._id,
      amountPaid: totalAmount,
      paymentDate: payment.paymentDate,
    });
    await ticket.save();

    // Call the payment initialization logic
    const callbackUrl = 'http://localhost:3001/payment-confirmed'; // Replace with your actual callback URL
    const authorizationUrl = await initializePayment(totalAmount, email, reference, callbackUrl);

    // Send the payment link to the user
    res.status(200).json({
      success: true,
      message: 'Payment link generated successfully',
      payment,
      authorizationUrl,
      reference,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
    });
  }
});


/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Verify payment and send ticket to user
 * @route `/api/ticket/verify`
 * @access Private
 * @type POST
 */
exports.verifyAndSendTicket = catchAsync(async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { reference } = req.body;

    console.log('Request Body:', req.body);
    console.log('Ticket ID:', ticketId);



    const paymentData = await verifyPayment(reference);
    console.log('Payment Data:', paymentData);

    // Check if the payment is successful
    if (paymentData.status !== 'success') {
      console.log('Payment verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Retrieve the corresponding ticket from the database using the ticketId
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      console.log('Ticket not found with ID:', ticketId);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get the ticket price from the ticket document
    const ticketPrice = ticket.price;
    console.log('Ticket Price:', ticketPrice);


    const actualAmountPaid = paymentData.amount / 100; 
    console.log('Actual Amount Paid:', actualAmountPaid);

    // Calculate the quantity of tickets paid for based on the actual amount paid and ticket price
    const quantityPaid = actualAmountPaid / ticketPrice;
    console.log('Quantity Paid:', quantityPaid);

    // Check if there are enough tickets available for deduction
    if (ticket.quantity >= quantityPaid) {
      // Deduct the paid quantity from the ticket quantity
      ticket.quantity -= quantityPaid;

      // Update the amountGotten field in the Event model
      const event = await Event.findById(ticket._event);
      event.amountGotten += parseFloat(actualAmountPaid);
      await event.save();

      await ticket.save();
      console.log('New ticket quantity:', ticket.quantity);

      // Check if the ticket quantity becomes zero and handle accordingly
      if (ticket.quantity === 0) {
        // console.log('No more tickets available for deduction');
        return res.status(400).json({ error: 'No more tickets available' });
        // You can add additional logic here if needed, such as marking the ticket as sold out.
      }

    } else {
      // console.log('Not enough tickets available for deduction');
      return res.status(400).json({ error: 'Not enough tickets available for deduction' });
    }

      // Get the email from the paymentData (assuming it's stored in paymentData.customer.email)
      const userEmail = paymentData.customer.email;
      const event = await Event.findById(ticket._event);
   // Prepare the message with ticket details
   let message = `
   <html>
     <head>
       <style>
         body {
           font-family: Arial, sans-serif;
           background-color: #f0f0f0;
         }
         .container {
           max-width: 600px;
           margin: 0 auto;
           padding: 20px;
           background-color: #fff;
           border-radius: 5px;
           box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
         }
         h1 {
           color: #007bff;
           text-align: center;
         }
         .ticket-details {
           margin-bottom: 10px;
         }
         .ticket-details h2 {
           color: #333;
           font-size: 16px;
           margin: 5px 0;
         }
         .ticket-details p {
           color: #777;
           font-size: 14px;
           margin: 0;
         }
         .event-image {
           display: block;
           width: 100%;
           border-radius: 5px;
           margin-bottom: 10px;
         }
         hr {
           border: none;
           border-top: 1px solid #ddd;
           margin: 20px 0;
         }
       </style>
     </head>
     <body>
       <div class="container">
         <h1>Thank you for your payment!</h1>
         <p>Here are your ${quantityPaid} ticket(s) details:</p>
   `;
 
   // Generate ticket details for each ticket purchased
   for (let i = 0; i < quantityPaid; i++) {
     message += `
       <img class="event-image" src="${event.image}" alt="Event Image">
       <div class="ticket-details">
         <h2>Event Name:</h2>
         <p>${event.name}</p>
       </div>
       <div class="ticket-details">
         <h2>Start Date:</h2>
         <p>${event.startDate}</p>
       </div>
       <div class="ticket-details">
         <h2>End Date:</h2>
         <p>${event.endDate}</p>
       </div>
       <div class="ticket-details">
         <h2>Start Time:</h2>
         <p>${event.startTime}</p>
       </div>
       <div class="ticket-details">
         <h2>End Time:</h2>
         <p>${event.endTime}</p>
       </div>
       <div class="ticket-details">
         <h2>State:</h2>
         <p>${event.state}</p>
       </div>
       <div class="ticket-details">
         <h2>Venue:</h2>
         <p>${event.venue}</p>
       </div>
       <hr>
     `;
   }
 
   message += `
     </div>
   </body>
   </html>
 `;
 
     // Construct the ticket details object to be returned in the response
     const ticketDetails = {
      numberOfTickets: quantityPaid,
      eventDetails: {
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        state: event.state,
        venue: event.venue,
        image: event.image,
      },
    };
  
      // Send the email to the user with the ticket details
      await sendEmail({
        to: userEmail,
        subject: 'Here is your ticket 🚀',
        message,
      });
  
      // Return a success response if everything is completed
      return res.status(200).json({
        success: true,
        message: 'Payment verification successful',
        ticketDetails
      });


  } catch (error) {
    // console.error('Error during payment verification:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
    });
  }
});

/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Get free ticket
 * @route `/api/ticket/:ticketId/free`
 * @access Private
 * @type POST
 */
exports.freeTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params;
  const { email } = req.body;

  try {
    // Retrieve the corresponding ticket from the database using the ticketId
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if the requested quantity is available
    if (ticket.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'No tickets available for purchase',
      });
    }

    // Check if the ticket has a price (i.e., it is a paid ticket)
    if (ticket.price !== undefined) {
      // If the ticket has a price, it is a paid ticket
      return res.status(400).json({
        success: false,
        message: 'This is a paid ticket. You need to make the payment.',
      });
    } else {
      // For a free ticket, directly send the ticket details to the user's email
      const message = `Hello, thank you for registering! Here is your ticket details`;

      await sendEmail({
        to: email,
        subject: 'Here is your ticket 🚀',
        message,
      });

      return res.status(200).json({
        success: true,
        message: 'Ticket sent to your email.',
        ticket,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.',
    });
  }
});


/**
 * Get recent payments for tickets
  * @author Okpe Onoja <okpeonoja18@gmail.com>
  * @description Get recent payments for tickets
 * @route GET /api/ticket/recentPayments
 * @access Public
 */
exports.getRecentPaymentsForTickets = catchAsync(async (req, res, next) => {
  try {
    const { filter } = req.query; // The filter query parameter will specify the date range (today, weekly, monthly)

    // Define the date range based on the filter
    let startDate, endDate;
    if (filter === 'today') {
      startDate = new Date();
      endDate = new Date();
    } else if (filter === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    } else if (filter === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
    } else {
      // If an invalid filter is specified, return an error response
      return res.status(400).json({
        success: false,
        message: 'Invalid filter specified',
      });
    }

    // Find tickets with payment records within the date range
    const tickets = await Ticket.find({
      'paymentRecords.paymentDate': {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate('_event');
    

    // Extract event details based on the ticket
    const events = [];
    tickets.forEach((ticket) => {
      if (ticket._event) {
        const eventDetails = {
          eventId: ticket._event._id,
          eventImage: ticket._event.image,
          eventTitle: ticket._event.title,
          eventName: ticket._event.name,
          eventStartDate: ticket._event.startDate,
          eventEndDate: ticket._event.endDate,
          eventPricing: ticket._event.pricing,
          eventVenue: ticket._event.venue,
          eventDescription: ticket._event.description,
        };
        events.push(eventDetails);
      }
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(new AppError('An error occurred. Please try again.', 500));
  }
});



/**
 * @author Okpe Onoja <okpeonoja18@gmail.com>
 * @description Delete a ticket
 * @route `/api/ticket/deleteticket/:id`
 * @access Private
 * @type DELETE
 */
exports.deleteEvent =  catchAsync(async (req, res, next) =>{
    try {
    //Get the event id
    const tick = await Ticket.findByIdAndDelete(req.params.id)

    // Check if the ticket exists
    if (!tick) {
        return next(new AppError('No ticket found with that Id', 404));
    }

    // Return data after the ticket has been deleted
    res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully',
        data : {
            user: null
        }
    })
    } catch (error) {
        next(new AppError('An error occurred. Please try again.', 500));
    }
})
