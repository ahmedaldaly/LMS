const Joi = require('joi');
const mongoose = require('mongoose');
const blackListSchema = new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true,
        trim:true
    }
},{timestamps:true})
const BlackList = mongoose.model('BlackList' ,blackListSchema)

function validateBlackList(obj){
    const schema = Joi.object({
        token:Joi.string().required()
    })
}
module.exports = {BlackList , validateBlackList}