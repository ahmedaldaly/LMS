const jwt = require('jsonwebtoken');
const {User} = require('../module/user')
const {BlackList } = require('../module/blackList')

const authraiztion = async (req , res ,next) =>{
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) {res.status(400).json({message:'token not found'})}
        const checkBlackList = await BlackList.findOne({token:token})
        if(checkBlackList){res.status(400).json({message:'token is blacklisted'})}
        else{
            const decoded = jwt.verify(token ,process.env.JWT_SECRET || 'secret1230');
            const user = await User.findById(decoded.id)
            if(!user){res.status(404).json({message:'user not found'})}
            req.user = user
            next();
        }
    }
    catch(err){res.status(500).json({message:'token is not valid'})}
}
const isAdmin =async(req , res ,next)=> {
    try{
        const user = await User.findById(req.user._id)
        if(user.isAdmin){next()}
        else{res.status(403).json({message:'you are not admin'})}
    }catch(err){res.status(500).json(err)}
}
const isTeacher =async(req , res ,next)=> {
    try{
        const user = await User.findById(req.user._id)
        if(user.isTeacher){next()}
        else{res.status(403).json({message:'you are not admin'})}
    }catch(err){res.status(500).json(err)}
}
module.exports = {authraiztion ,isAdmin ,isTeacher}