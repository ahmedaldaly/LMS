const { User, validateLogin, validateRegister } = require("../module/user");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {BlackList , validateBlackList} = require('../module/blackList')
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