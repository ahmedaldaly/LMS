const router = require('express').Router();
const {Register, LogIn, LogOut, resetPassword, resetPasswordToken, googleAuth, googleCallback} = require('../controller/authController')
const {isTeacher, isAdmin, authraiztion} = require('../middelware/authraiztion')

router.post('/register', Register);
router.post('/login', LogIn);
router.post('/logout', authraiztion, LogOut);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPasswordToken);

// Google Auth Routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;