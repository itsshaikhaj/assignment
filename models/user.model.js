const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    user_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true
    },
    profile_image: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'customer'],
        required: true,
    },
    password: {
        type: String,
        required: true,
        // select: false
    },
    gender: {
        type: String,
        enum: ["male", "female", "others"],
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('user', UserSchema)
