const mongoose = require('mongoose');

const Comment = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, required: false, default: 0 }
});

const serviceSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true },
    category: { type: String, required: true },
    offre: { type: String, required: true },
    duration: { type: String, required: false },
    target: { type: String, required: true },
    price: { type: Number, required: true, default: 0},
    maxReservation: { type: Number, required: true },
    place: { type: String, required: true },
    owner: { type: Object, required: true },
    tags: { type: [String], required: false },
    mapLink: { type: String, required: false },
    image: { type: String, required: true },
    images: { type: Array, required: true },
    video: { type: String, required: false },
    menu: { type: String, required: false },
    reservations: { type: Array, required: false },
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

module.exports = mongoose.model('Service', serviceSchema);