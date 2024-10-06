const mongoose = require('mongoose');

const Comment = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, required: false, default: 0 }
});

const eventSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    owner: { type: Object, required: true },
    place: { type: String, required: true },
    image: { type: String, required: true },
    images: { type: Array, required: true },
    video: { type: String, required: false },
    menu: { type: String, required: false },
    maxReservation: { type: Number, required: true },
    price: { type: Number, required: true, default: 0 },
    tags: { type: [String], required: false },
    mapLink: { type: String, required: false },
    reservations: { type: Array, required: false },
    otherInfos: { type: String, required: false },
    youtubeVideoLink: { type: String, required: false },
    facebookLink: { type: String, required: false },
    instagramLink: { type: String, required: false },
    twitterLink: { type: String, required: false },
    whatsappLink: { type: String, required: false },
    comments: [Comment],
    coupons: { type: Object, required: false },
    rate: { type: Object, required: false },
    validated: { type: Boolean, required: true },
    date: { type: Date, required: false },
    createdAt: { type: Date, required: false }
})

module.exports = mongoose.model('Event', eventSchema);