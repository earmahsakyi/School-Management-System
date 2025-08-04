const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
   email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['parent', 'admin'],
        default: 'admin',
        required: true  
        
    },
    linkedParentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent'

    },
    profileUpdated: {
        type: Boolean,
        default: false
    },
    isVerified : {
        type: Boolean,
        default: false
    },
    resetToken : String,
    verifyToken: String,
    resetTokenExpiry: Date,
    tokenVersion: {
        type: Number,
        default: 0
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lockLevel: { type: Number, default: 0 }, 
    lockedManually: { type: Boolean, default: false },

});
module.exports = mongoose.model('User', UserSchema);
