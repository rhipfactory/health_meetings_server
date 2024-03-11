const express = require('express');
const adminController = require('../controllers/admin.controller')
const authController = require('./../controllers/auth.controller');

const router = express()

router.get("/verify/:token", adminController.verifyAdminAccess)


// Protect all routes after this middleware
router.use(authController.protect);

// Apply the 'Admin' restriction middleware to all routes
router.use(authController.restrict('Admin'));

router.get("/getusers", adminController.getAll)

router.get('/attendee',  adminController.getAttendee);

router.get('/organisers',  adminController.getOrganisers);

router.get('/allpayments',  adminController.getAllPayments);

router.get('/requests',  adminController.getAllReuqest);

router.get('/penevent',  adminController.getTotalPendingEvent);

router.get("/activities", adminController.getActivities)

router.get('/paid',  adminController.getTotalPaidEvents);

router.get('/free',  adminController.getTotalFreeEvents);

router.get('/totalamount',  adminController.getTotalPaidTicketAmount);

router.get('/totalsoldtickets', adminController.getTotalSoldTicketsQuantityZero);

router.patch('/approve/:requestId',  adminController.updateWithdrawalRequestStatus);

router.post("/new/invite", adminController.newAdmin)

router.put("/approve/:eventId",  adminController.approveEvent)

router.delete("/deleteprofile/:id", adminController.deleteUser)

module.exports = router;