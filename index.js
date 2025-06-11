const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const connectDB = require('./config/connectDB')
const {errorHandler , notFound} = require('./middelware/errorHandler')
// google
const session = require("express-session");
const passport = require("passport");
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);


app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
connectDB()
  app.use('/api/auth', require('./router/auth'))
  app.use(errorHandler)
  app.use(notFound)
app.listen(process.env.PORT ||8000,()=>{
    console.log('server is running')
})