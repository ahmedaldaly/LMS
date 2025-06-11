const { User, validateLogin, validateRegister } = require("../module/user");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {BlackList , validateBlackList} = require('../module/blackList')
const nodemailer = require('nodemailer')
//google auth
const passport = require("passport"); 
const GoogleStrategy = require("passport-google-oauth20").Strategy; 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID, 
      clientSecret: process.env.CLIENT_SECRET, 
      callbackURL: "http://localhost:4000/api/auth/google/callback"


    },
    async (accessToken, refreshToken, profile, done) => { 
      try {
        let existingUser = await User.findOne({ email: profile.emails[0].value }); 
        const fullName = profile.displayName.split(' ');
        const firstName = fullName[0]; // أول جزء هو الاسم الأول
        const lastName = fullName.slice(1).join(' '); // الباقي هو اسم العائلة
        const random3Digits = Math.floor(100 + Math.random() * 900);
        if (!existingUser) {
          existingUser = new User({
            email: profile.emails[0].value, 
            firstName: firstName,
            lastName: lastName,
            password: "google-auth", 
            phone:'01000000000',
            userName:firstName + random3Digits,
            image: {
              url: profile.photos[0].value || undefined,
              id: "google"
            }
          });

          await existingUser.save(); 
        }

     
        const token = jwt.sign(
          { id: existingUser._id, isAdmin: existingUser.isAdmin , isTeacher: existingUser.isTeacher},
          process.env.JWT_SECRET || "secret12345", 
          { expiresIn: "7d" } 
        );

        existingUser.token = token; 
        await existingUser.save(); 

        return done(null, existingUser); 
      } catch (error) {
        return done(error, null); 
      }
    }
  )
);


module.exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"], 
  prompt: "consent", 
});


module.exports.googleCallback = async (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect("/login");
    }

    req.user = user;
    console.log("User authenticated successfully:", req.user);
    res.redirect(`http://localhost:5173/profile?token=${req.user.token}`);
  })(req, res, next);
};


// تسجيل خروج المستخدم
// module.exports.logout = (req, res) => {
//   req.logout(() => { 
//     res.redirect("/"); 
//   });
// };

module.exports.Register = asyncHandler(async (req, res) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      res.status(400).json({ message: "user already exists" });
    }
    const username = await User.findOne({ userName: req.body.userName });
    if (username) {
      res.status(400).json({ message: "username already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      userName: req.body.userName,
      phone: req.body.phone,
    });
    
    await newUser.save();
    const token = jwt.sign(
      {
        id: newUser._id,
        isAdmin: newUser.isAdmin,
        isTeacher: newUser.isTeacher,
      },
      process.env.JWT_SECRET || "secret1230",
      { expiresIn: "7d" }
    );
    newUser.token = token;
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports.LogIn = asyncHandler(async (req,res)=>{
  try{
    const {error} = validateLogin(req.body);
    if(error){res.status(400).json({message:error.details[0].message})};
    const {email ,password ,userName} = req.body;
  const user = await User.findOne({$or:[{email},{userName}]});
  if (!user){res.status(400).json({message:'invalid password or userName'})}
  const isMatch = await bcrypt.compare(password,user.password);
  if(!isMatch){res.status(400).json({message:'invalid password or userName'})}
  const token = jwt.sign(
    {
      id: user._id,
      isAdmin: user.isAdmin,
      isTeacher: user.isTeacher,
    },
    process.env.JWT_SECRET || "secret1230",
    { expiresIn: "7d" }
  );
  user.token = token;
  await user.save();
  const { password: _, ...others } = user._doc;

  res.status(200).json(others);
  } catch(err) { res.status(500).json(err); }
})
module.exports.LogOut = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.token) {
      return res.status(400).json({ message: 'User already logged out' });
    }

    // الطريقة الآمنة للتعامل مع validateBlackList
    const validationResult = validateBlackList(user.token);
    if (validationResult?.error) {
      return res.status(400).json({ message: validationResult.error.details[0].message });
    }

    const black = new BlackList({ token: user.token });
    await black.save();

    user.token = null;
    await user.save();

    res.status(200).json({ message: 'Logout success' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
});

const transForm = nodemailer.createTransport({
  service : 'gmail',

  auth : {
    user :process.env.USER || 'ranaandahmed55@gmail.com',
    pass :process.env.PASS || '123456'
  }

})
module.exports.resetPassword = asyncHandler(async (req , res)=>{
  try{
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user){res.status(404).json({message:'user not found'})}
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET || 'secret1230',{expiresIn: '1h'})
    const link = `${process.env.FRONTENDURL}/reset-password/${token}`
    const mailOptions = {
      from : process.env.USER || 'ranaandahmed55@gmail.com',
      to : email,
      subject:'Reset Your Password',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #4285f4; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Reset Your Password</h1>
    </div>
    
    <div style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hello,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We received a request to reset your password. Click the button below to proceed:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="display: inline-block; background-color: #4285f4; color: white; 
                      padding: 12px 24px; border-radius: 4px; text-decoration: none; 
                      font-weight: bold; font-size: 16px;">
                Reset Password
            </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
            If you didn't request this password reset, please ignore this email or contact our support team if you have any concerns.
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #777; margin-top: 30px;">
            For security reasons, this link will expire in 1 hour.
        </p>
    </div>
    
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
        <p style="margin: 0;">© 2023 Your Company Name. All rights reserved.</p>
    </div>
</div>
      `,
    }
    await transForm.sendMail(mailOptions);
    res.status(200).json({message:'Email sent successfully'});
  }catch(err){res.status(500).json(err)}
})
module.exports.resetPasswordToken = asyncHandler(async (req , res )=>{
  try{
    const token = req.params.token;
    const decoded = jwt.verify(token ,process.env.JWT_SECRET || 'secret1230');
    const user = await User.findById(decoded.id);
    if(!user){res.status(404).json({message:'user not found'})}
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({message:'password reset successfully , please login again'})
  }catch(err){res.status(500).json(err)}
})