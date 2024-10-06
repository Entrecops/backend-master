const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    email: { type: String, required: false },
    password: { type: String, required: false },
    profileImage: { type: String, required: false },
    provider: { type: String, required: false },
    tel: { type: Number, required: false },
    mapLink: { type: String, required: false },
    location: { type: String, required: false },
    services: { type: String, required: false },
    accountValidated: { type: Boolean, required: false },
    adminViewed: { type: Boolean, default: false },
    otherInfos: { type: String, required: false },
    role: { type: String, required: true },
    recommandations: { type: Array, required: false },
    reservations: { type: Array, required: false },
    sanctionDateLimit: { type: Date, required: false },
    gallery: { type: Array, required: false },
    date: { type: Date, required: false },
})

module.exports = mongoose.model('User', userSchema)