const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/database');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const path = require('path');
const socketIo = require("socket.io");
const passportInit = require('./api/lib/passport-init');
const { rootUrl } = require('./config/rootUrl');
const ServiceCops = require('./api/models/service');
const EventCops = require('./api/models/event');

const execution = async () => {
    const currentDate = new Date();
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 30);

    // Supprimer les documents dont la date est inférieure à 30 jours par rapport à la date actuelle
    await ServiceCops.deleteMany({ date: { $lte: date30DaysAgo } }).exec();
    await EventCops.deleteMany({ date: { $lte: date30DaysAgo } }).exec();

    // Retirer les sous-documents de reservations dont la date est inférieure à 30 jours par rapport à la date actuelle
    await ServiceCops.updateMany(
        { "reservations.date": { $lte: date30DaysAgo } },
        { $pull: { reservations: { date: { $lte: date30DaysAgo } } } }
    ).exec();
    await EventCops.updateMany(
        { "reservations.date": { $lte: date30DaysAgo } },
        { $pull: { reservations: { date: { $lte: date30DaysAgo } } } }
    ).exec();

    // Mettre à jour les documents pour supprimer les coupons dont la date limite est passée
    await ServiceCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate } },
        { $set: { coupons: null } }
    ).exec();
    await EventCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate } },
        { $set: { coupons: null } }
    ).exec();
}

// Connect to db
mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', async () => {
    await execution();
});

module.exports = execution;


