const mongoose = require('mongoose');
const Joi = require('joi');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        maxlength: 200
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 200,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isTeacher: {
        type: Boolean,
        default: false
    },
    image: {
        ur: {
            type: String,
            default: 'https://img.icons8.com/?size=100&id=X0xte8rcpQpL&format=png&color=000000'
        },
        id: {
            type: String
        }
    },
    token: {
        type: String,
        trim: true
    }
});

const User = mongoose.model('User', userSchema);

function validateRegister(obj) {
    const schema = Joi.object({
        firstName: Joi.string().required().min(3).max(30),
        lastName: Joi.string().required().min(3).max(30),
        email: Joi.string().email().required().max(200),
        password: Joi.string().required().min(8).max(200),
        phone: Joi.string().required(),
        userName: Joi.string().required()
    });
    return schema.validate(obj);
}

function validateLogin(obj) {
    const schema = Joi.object({
        userName: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string().required()
    });
    return schema.validate(obj);
}

module.exports = {
    User,
    validateLogin,
    validateRegister
};
