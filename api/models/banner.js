const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    link: { type: String, required: true },
    followlink: { type: String, required: false },
    title: { type: String, required: false },
    date: { type: Date, required: false },
})

module.exports = mongoose.model('Banner', bannerSchema)