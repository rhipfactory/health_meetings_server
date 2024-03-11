const express = require('express');
const userController = require("../controllers/user.controller")
const authController = require('./../controllers/auth.controller');

const router = express()

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/", userController.ping)

router.put('/addorganiser', userController.addProfile)

router.get('/getorganiser', userController.getOrgan)

router.patch('/editorg/:id', userController.editorg);

router.get("/getprofile/:id", userController.getProfile)

router.put('/editprofile/:id', userController.editProfile);

module.exports = router;