const router = require('express').Router();
const {Register,LogIn , LogOut} =require('../controller/authController')
const {isTeacher,isAdmin,authraiztion} = require('../middelware/authraiztion')
router.post('/register',Register);
router.post('/login',LogIn);
router.post('/logout',authraiztion,LogOut);
module.exports = router;