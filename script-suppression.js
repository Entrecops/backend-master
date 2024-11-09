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
    const currentDate2 = new Date().toISOString();
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

    // Vérifier les coupons expirés dans ServiceCops
    const expiredServiceCops = await ServiceCops.find({ "coupons.datelimite": { $lte: currentDate } });
    console.log(`Coupons expirés dans ServiceCops: ${expiredServiceCops.length}`);

    // Vérifier les coupons expirés dans EventCops
    const expiredEventCops = await EventCops.find({ "coupons.datelimite": { $lte: currentDate } });
    console.log(`Coupons expirés dans EventsCops: ${expiredEventCops.length}`);

    // Mettre à jour ServiceCops
    const serviceUpdateResult = await ServiceCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate2 } },
        { $unset: { coupons: "" } }
    );
    console.log(`ServiceCops modifiés: ${serviceUpdateResult.modifiedCount}`);

    // Mettre à jour EventCops
    const eventUpdateResult = await EventCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate2 } },
        { $unset: { coupons: "" } }
    );
    console.log(`EventCops modifiés: ${eventUpdateResult.modifiedCount}`);


    // // Mettre à jour les documents pour supprimer les coupons dont la date limite est passée
    await ServiceCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate2 } },
        { $set: { coupons: null } }
    ).exec();
    await EventCops.updateMany(
        { "coupons.datelimite": { $lte: currentDate2 } },
        { $set: { coupons: null } }
    ).exec();

}

module.exports = execution;


