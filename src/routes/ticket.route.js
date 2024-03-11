const express = require('express');
const ticketController = require("../controllers/ticket.controller")
const authController = require('./../controllers/auth.controller');

const router = express()

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/all", ticketController.getAll)

router.get("/getticket/:id", ticketController.getOne)

router.get("/allpaid", ticketController.getUserTickets)

router.get('/allpaid/:ticketId', ticketController.getUserTicket)

router.post('/create/:eventId', authController.restrict('Organiser') , ticketController.createTicket);

router.post('/:ticketId/pay', ticketController.payTicket);

router.post('/verify/:ticketId', ticketController.verifyAndSendTicket)

router.post('/:ticketId/free', ticketController.freeTicket);

router.get("/recentPayments", ticketController.getRecentPaymentsForTickets)

router.delete("/deleteticket/:id", authController.restrict('Admin') ,ticketController.deleteEvent);

module.exports = router;