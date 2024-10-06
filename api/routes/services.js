const express = require('express')
const path = require("path");
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const uniqid = require('uniqid');
const socketIo = require("socket.io");

const Service = require('../models/service');
const placePayment = require('../lib/payougo');

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploads/servicesimages')
        },
        filename: function (req, file, cb) {
            cb(null, "service-" + Date.now() + path.extname(file.originalname))
        }
    })

    const fileFilter = (req, file, cb) => {
        if (file.mimetype === ['jpeg', 'png','jpg'].includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }

    const upload = multer({
        storage: storage,
        limits: {
            fileSize: 1024 * 1024 * 50
        },
        //fileFilter: fileFilter
    }).array('images', 10);

    // Service creation
    router.post('/new', upload, (req, res, next) => {
        let video = '';
        let menu = '';

        req.files.forEach(file => {
            if (file && file.fieldname === 'serviceVideo') {
                video = file.path;
            }
            if (file && file.fieldname === 'serviceMenu') {
                menu = file.path;
            }
        })
        //const images = req.files.filter(el => el.fieldname === "images");
        //const filesPath = images.map(file => file.path)
        const images = req.files.map((file) => file.path);
        // Save new service
        const service = new Service({
            _id: mongoose.Types.ObjectId(),
            title: req.body.title,
            owner: JSON.parse(req.body.user),
            images: images,
            image: images.length > 0 ? images[0] : '',
            target: req.body.cible,
            youtubeVideoLink: req.body.youtubeVideoLink,
            facebookLink: req.body.facebookLink,
            instagramLink: req.body.instagramLink,
            twitterLink: req.body.twitterLink,
            whatsappLink: req.body.whatsappLink,
            video: video,
            menu: menu,
            category: req.body.category,
            maxReservation: parseInt(req.body.maxReservation),
            offre: req.body.offre,
            duration: req.body.duration,
            place: req.body.place,
            tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? req.body.tags.split(',') : [],
            mapLink: req.body.mapLink,
            validated: false,
            comments: [],
            reservations: [],
            price: req.body.price,
            date: new Date(),
            createdAt: new Date()
        })
        console.log("debug1", service);
        service.save()
        .then(service => {
            res.status(201).json({
                message: 'Service saved successfully',
                service: service
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
    })

    // Update service
    router.patch('/:id', upload, (req, res, next) => {
        let request = {
            title: req.body.title,
            target: req.body.cible,
            youtubeVideoLink: req.body.youtubeVideoLink,
            facebookLink: req.body.facebookLink,
            instagramLink: req.body.instagramLink,
            twitterLink: req.body.twitterLink,
            whatsappLink: req.body.whatsappLink,
            category: req.body.category,
            offre: req.body.offre,
            price: req.body.price,
            duration: req.body.duration,
            maxReservation: parseInt(req.body.maxReservation),
            place: req.body.place,
            tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? req.body.tags.split(',') : [],
            mapLink: req.body.mapLink,
        };

        if (req.files) {
            // Vérify if there is new images
            req.files.forEach(file => {
                if (file.fieldname === 'images') {
                    const images = req.files.filter(el => el.fieldname === "images");
                    const filesPath = images.map(file => file.path)
                    request = { ...request, images: filesPath, image: images[0].path }
                    return;
                }
            })

            // Vérify if there is a new video
            req.files.forEach(file => {
                if (file.fieldname === 'serviceVideo') {
                    request = { ...request, video: file.path }
                    return;
                }
                if (file.fieldname === 'serviceMenu') {
                    request = { ...request, menu: file.path }
                    return;
                }
            })
        }
        Service.updateOne({ _id: req.params.id }, {
            $set: request
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Search services by  title
    router.get('/:query/search', (req, res, next) => {
        const query = req.params.query
        Service.find({ title: new RegExp(query, 'i'), validated: true })
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get all services
    router.get('/all', (req, res, next) => {
        Service.find({}).sort({ $natural: -1 })
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get last 5  services
    router.get('/5', (req, res, next) => {
        Service.find({}).sort({ $natural: -1 }).limit(5)
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get all validated services
    router.get('/validated/all', (req, res, next) => {
        Service.find({validated: true}).sort({ $natural: -1 })
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get services of the same category
    router.get('/category/:name', (req, res, next) => {
        Service.find({category: req.params.name, validated: true}).sort({ $natural: -1 })
        .exec()
        .then(services => {
            return res.status(200).json({
                services: services
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Get all services with coupon
    router.get('/with/coupon', (req, res, next) => {
        Service.find({"coupons": { $ne:null }, "coupons.nCoupons":  {$gt: 0 }, validated: true})
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get last 4 validated services
    router.get('/4', (req, res, next) => {
        Service.find({validated: true}).sort({ 'rate.value' : 'desc' }).limit(4)
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get a single service
    router.get('/:id', (req, res, next) => {
        Service.findById(req.params.id)
            .exec()
            .then(service => {
                return res.status(200).json({
                    service: service
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Get a all services of a supplier
    router.get('/supplier/:id', (req, res, next) => {
        Service.find({"owner._id" : req.params.id, validated: true})
        .exec()
        .then(services => {
            return res.status(200).json({
                services: services
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Validate service
    router.patch('/validate/:id', (req, res, next) => {
        Service.updateOne({ _id: req.params.id }, {
            $set: { validated: true }
        })
            .exec()
            .then(service => {
                return res.status(201).json({
                    service: service
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })

    // Make a reservation
    router.patch('/:id/makereservation', (req, res, next) => {
        const userReservation = req.body.reservation;
        const id = req.params.id;
        // check if user is already registered to this service
        Service.findOne({ _id: id, 'reservations.userId': userReservation.userId, 'reservations.paid': true })
        .exec()
        .then( async (service)=> {
            if(service) {
                // The user is already registered to this service
                return res.status(401).json({
                    service: service
                })
            } else {
                const service = await Service.findOne({ _id: id });
                if( service.price > 0 ){
                    userReservation['paid'] = false;
                    userReservation['totalAmount'] = service.price;
                    userReservation['adminViewed'] = false;
                    userReservation['partnerViewed'] = false;
                    userReservation.transactionId = uniqid();
                    Service.updateOne({ _id: req.params.id }, {
                        $push: { reservations: userReservation }
                    }).then(service => {
                        console.log( userReservation );

                        //Emit event of a new reservation
                         req.io.emit('newReservation', userReservation);

                        return res.status(200).json({
                            event: userReservation,
                            processPayment: true,
                        })
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err.message })
                    })
                } else {
                    userReservation[ 'paid' ] = true;
                    userReservation[ 'totalAmount' ] = 0;
                    userReservation['adminViewed'] = false;
                    userReservation['partnerViewed'] = false;
                    Service.updateOne({ _id: req.params.id }, {
                        $push: { reservations: userReservation }
                    })
                    .exec()
                    .then(service => {
                        //Emit event of a new reservation
                        req.io.emit('newReservation', userReservation);

                        return res.status(201).json({
                            event: userReservation,
                            processPayment: false
                        })
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err })
                    })
                }
            }
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Submit a comment
    router.patch('/:id/comment', (req, res, next) => {
        let comment = req.body.comment;
        comment._id = mongoose.Types.ObjectId();
        Service.updateOne({ _id: req.params.id }, {
            $push: { comments: comment }
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Delete a comment
    router.patch('/:id/deletecomment', (req, res, next) => {
        let commentId = req.body.commentId;

        Service.updateOne({ _id: req.params.id }, {
            $pull: { comments: {_id: commentId} }
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Vote an service
    router.patch('/:id/vote/:value', (req, res, next) => {
        Service.updateOne({ _id: req.params.id }, {
            $set: { rate: { value: Number(req.params.value),  clients: req.body.clients  } }
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Set coupons
    router.patch('/:id/add/coupon', (req, res, next) => {
        Service.updateOne({ _id: req.params.id }, {
            $set: { coupons: req.body.coupon }
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })


    // Remove coupons
    router.patch('/:id/remove/coupon', (req, res, next) => {
        Service.updateOne({ _id: req.params.id }, {
            $set: { coupons: {} }
        })
        .exec()
        .then(service => {
            return res.status(201).json({
                service: service
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
    })

    // Delete service
    router.delete('/:id', (req, res, next) => {
        Service.remove({ _id: req.params.id })
            .exec()
            .then(service => {
                return res.status(201).json({
                    service: service
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    })


    // Search services by category, town or date
    router.post('/filter', (req, res, next) => {
        const category = req.body.category
        const tag = req.body.tag
        const tagRegex = new RegExp(tag, 'i')
        const town = req.body.town
        const townRegex = new RegExp(town, 'i')
        const date1 = req.body.date1
        const date2 = req.body.date2
        const query = [{validated: true}];
        // Category
        if( category != undefined && category != '' && category != null ){
            query.push({category});
        }
        // Tag
        if( tag != undefined && tag != '' && tag != null ){
            query.push({tags: tagRegex});
        }
        // Town
        if( town != undefined && town != '' && town != null ){
            query.push({town: townRegex});
        }
        // Date1
        if( date1 != undefined && date1 != '' && date2 != null ){
            query.push({createdAt: { $gt: date1}});
        }
        // Date2
        if( date2 != undefined && date2 != '' && date2 != null ){
            query.push({createdAt: { $lt: date2}});
        }
        console.log( query );
        Service.find({ $and: query}).sort({ $natural: -1 })
            .exec()
            .then(services => {
                return res.status(200).json({
                    services: services
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
    });

module.exports = router;
