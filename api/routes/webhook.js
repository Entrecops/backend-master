const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Event = require('../models/event');
const Service = require('../models/service');

router.get('/webhook', async (req, res, next) => {
    // Set event paid to true
    const transactionId = req.query.rI;
    const totalAmount = req.query.rMt;
    console.log( totalAmount );
    const event = await Event.findOne({
        'reservations.transactionId': transactionId, 
    });
    const service = await Service.findOne({
        'reservations.transactionId': transactionId, 
    });
    if( event != null ) {
        const index = event.reservations.findIndex( x => x.transactionId == transactionId );
        event.reservations[index]['paid'] = true;
        event.reservations[index]['paidDate'] = new Date();
        await Event.updateOne({_id: event._id}, { reservations: event.reservations})
        return res.status(200).json({"success": true});
    } else if( service != null ) {
        const index = service.reservations.findIndex( x => x.transactionId == transactionId );
        service.reservations[index]['paid'] = true;
        service.reservations[index]['paidDate'] = new Date();
        await Service.updateOne({_id: service._id}, { reservations: service.reservations})
        return res.status(200).json({"success": true});
    } else {
        return res.status(404).json({
            'message': 'event not found'
        });
    }
});

module.exports = router