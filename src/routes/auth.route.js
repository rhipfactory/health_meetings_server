const express = require('express');
const router = express();

const authController = require("../controllers/auth.controller")


// Ping route
router.get("/", authController.ping)

router.post("/signup", authController.signup)

router.post("/vv/:token", authController.verifyAdmin)

router.post("/organisersignup", authController.organiserSignup)

router.post("/login",authController.login)

router.post("/adminlogin",authController.adminLogin)

router.post("/verify", authController.verify)

router.post('/forgotPassword', authController.forgotPassword);

router.post("/resetpassword",  authController.resetPassword)

router.post("/resendverification", authController.resendVerification)

router.post("/logout", authController.Logout)

router.use(authController.protect);

router.post("/adnew",  authController.restrict('Admin'), authController.addAdmin)

router.post("/updatepassword",  authController.updatePassword)

module.exports = router;