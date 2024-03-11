const express = require('express');
const eventController = require("../controllers/event.controller")
const authController = require('./../controllers/auth.controller');
const feedController = require('../controllers/feed.controller')

const router = express()
router.get("/all", eventController.getAll)

router.get("/getevent/:id", eventController.getOne)

router.get("/feed", feedController.getFeed)

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/myevents', eventController.getEventsByOrganizer);

router.get('/ogevent/:eventId', eventController.getEventByOrganizerAndId);

router.post('/request', eventController.createWithdrawalRequest)

router.get('/totalAmount/:eventId', eventController.getTotalAmountForEvent)

router.get('/getallpaymentreceived', eventController.getUserReceivedPayments);

router.post('/create', authController.restrict('Organiser'), eventController.createEvent);

router.delete("/deleteevent/:id" , eventController.deleteEvent)

module.exports = router;
