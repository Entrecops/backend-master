const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const PDFDocument = require('pdfkit');
const path = require("path");
const fs = require('fs')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')

const User = require('../models/user');
const ServiceCops = require('../models/service');
const EventCops = require('../models/event');
const checkAuth = require('../middleware/checkAuth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/usersImages')
    },
    filename: function (req, file, cb) {
        cb(null, "user-profile-" + Date.now() + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})

// Create a user
router.post('/signup', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (user) {
                return res.status(409).json({
                    message: 'EMAIL_EXIST'
                })
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        })
                    } else {
                        const user = new User({
                            _id: mongoose.Types.ObjectId(),
                            name: req.body.name,
                            email: req.body.email,
                            profileImage: '',
                            tel: req.body.tel,
                            location: '',
                            accountValidated: false,
                            role: "user",
                            provider: "email",
                            password: hash,
                            date: new Date()
                        });
                        user.save()
                            .then(user => {
                                const token = jwt.sign({
                                    email: user.email,
                                    username: user.username,
                                    userId: user._id
                                }, "ENTRECOPS_SECRET.JWT_KEY",
                                {
                                    expiresIn: "24h"
                                });
                                const now = new Date();
                                const expiresDate = now.getTime() + 60 * 60 * 24  * 1000;
                                return res.status(201).json({
                                    message: 'User Created',
                                    token: token,
                                    user: user,
                                    expiresDate: expiresDate
                                })
                            }).catch(err => {
                                return res.status(500).json({ error: err })
                            })
                    }
                })
            }
        })
})

// User Login
router.post('/login', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: 'EMAIL_NOT_EXIST'
                })
            }
            // bcrypt.compare(req.body.password, user.password, (err, result) => {
            //     if (err) {
            //         return res.status(401).json({
            //             message: 'Auth Fail'
            //         })
            //     }
            //     if (result) {
            //         const token = jwt.sign({
            //             email: user.email,
            //             name: user.name,
            //             userId: user._id
            //         }, "ENTRECOPS_SECRET.JWT_KEY",
            //         {
            //             expiresIn: "24h"
            //         });
            //         const now = new Date();
            //         const expiresDate = now.getTime() + 60 * 60 * 24 * 1000;
            //         return res.status(201).json({
            //             message: 'User Login',
            //             token: token,
            //             user: user,
            //             expiresDate: expiresDate
            //         })
            //     }
            //     res.status(401).json({
            //         message: 'WRONG_PASSWORD'
            //     })
            // })
            const token = jwt.sign({
                email: user.email,
                name: user.name,
                userId: user._id
            }, "ENTRECOPS_SECRET.JWT_KEY",
            {
                expiresIn: "24h"
            });
            const now = new Date();
            const expiresDate = now.getTime() + 60 * 60 * 24 * 1000;
            return res.status(201).json({
                message: 'User Login',
                token: token,
                user: user,
                expiresDate: expiresDate
            })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err })
        })
})

// Social media account Login
router.post('/socialauth', (req, res, next) => {
    User.findOne({ name: req.body.name })
        .exec()
        .then(user => {
            const token = jwt.sign({
                name: req.body.name,
            }, "ENTRECOPS_SECRET.JWT_KEY",
                {
                    expiresIn: "24h"
                });
            const now = new Date();
            const expiresDate = now.getTime() + 60 * 60 * 24 * 1000;
            if(user && user.provider == "social") {
                return res.status(201).json({
                    message: 'User Created with his social account',
                    user: user,
                    token: token,
                    expiresDate: expiresDate
                })
            } else {
                const newUser = new User({
                    _id: mongoose.Types.ObjectId(),
                    name: req.body.name,
                    profileImage: req.body.photo,
                    provider: "social",
                    role: "user"
                })
                newUser.save()
                .then(user => {
                    return res.status(201).json({
                        message: 'User Created with his social account',
                        user: user,
                        token: token,
                        expiresDate: expiresDate
                    })
                })
                .catch(err => {
                    return res.status(500).json({ error: err })
                })
            }
        })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Regenarate token
router.post('/generatetoken', (req, res, next) => {
    const token = jwt.sign({
        email: req.body.email,
        name: req.body.name,
        userId: req.body._id
    }, "ENTRECOPS_SECRET.JWT_KEY",
    {
        expiresIn: "24h"
    });
    const now = new Date();
    const expiresDate = now.getTime() + 60 * 60 * 24 * 1000;
    return res.status(201).json({
        token: token,
        expiresDate: expiresDate
    })
})

/**
 * Admin reservations
 */
router.get('/admin-reservations/:noview?', async ( req, res, next ) =>{
    let reservations = [];
    const events = await EventCops.find({}).exec();
    const services = await ServiceCops.find({}).exec();
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if( event.reservations ) {
            for (let j = 0; j < event.reservations.length; j++) {
                const resa = event.reservations[j];
                const resaCopy = { ...resa };
                resaCopy.event = { ...event.toJSON() };
                resaCopy.user = await User.findById( resa.userId ).exec();
                reservations.push( resaCopy );
                event.reservations[j].adminViewed = true;
            }
            if( req.params.noview == undefined ) {
                EventCops.updateOne({_id: event._id}, { reservations: event.reservations }).exec();
            }
        }
    }
    
    for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if( service.reservations ) {
            for (let j = 0; j < service.reservations.length; j++) {
                const resa = service.reservations[j];
                const resaCopy = { ...resa };
                resaCopy.service = { ...service.toJSON() };
                resaCopy.user = await User.findById( resa.userId ).exec();
                reservations.push( resaCopy );
                service.reservations[j].adminViewed = true;
            }
            if( req.params.noview == undefined ) {
                ServiceCops.updateOne({_id: service._id}, { reservations: service.reservations }).exec();
            }
        }
    }
    reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json({ 
        message: "RESERVATIONS_RETRIEVED",
        body: reservations
    });

    return;
});

/**
 * Supplier reservations
 */
router.get('/supplier-reservations/:supplierId/:noview?', async ( req, res, next ) =>{
    let reservations = [];
    const supplierId = req.params.supplierId;
    const events = await EventCops.find({ "owner._id": supplierId}).exec();
    const services = await ServiceCops.find({ "owner._id": supplierId}).exec();
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if( event.reservations ) {
            for (let j = 0; j < event.reservations.length; j++) {
                const resa = event.reservations[j];
                const resaCopy = { ...resa };
                resaCopy.event = { ...event.toJSON() };
                resaCopy.user = await User.findById( resa.userId ).exec();
                reservations.push( resaCopy );
                event.reservations[j].partnerViewed = true;
            }
            if( req.params.noview == undefined ) {
                EventCops.updateOne({_id: event._id}, { reservations: event.reservations }).exec();
            }
        }
    }
    
    for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if( service.reservations ) {
            for (let j = 0; j < service.reservations.length; j++) {
                const resa = service.reservations[j];
                const resaCopy = { ...resa };
                resaCopy.service = { ...service.toJSON() };
                resaCopy.user = await User.findById( resa.userId ).exec();
                reservations.push( resaCopy );
                service.reservations[j].partnerViewed = true;
            }
            if( req.params.noview == undefined ) {
                ServiceCops.updateOne({_id: service._id}, { reservations: service.reservations }).exec();
            }
        }
    }
    reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json({ 
        message: "RESERVATIONS_RETRIEVED",
        body: reservations
    });

    return;
});

// Search user by name or email
router.get('/:query/search', (req, res, next) => {
    const query = req.params.query.toString()
    User.find({ $or: [{name: new RegExp(query, 'i')}, {email: new RegExp(query, 'i')} ]})
        .exec()
        .then(users => {
            return res.status(201).json({
                users: users
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

//Update profile without image
router.patch('/:userId', (req, res, next) => {
    User.findById(req.params.userId)
    .exec()
    .then(user => {
        if(user) {
            User.updateOne({ _id: user._id }, {
                $set: {
                    name: req.body.name,
                    email: req.body.email,
                    tel: req.body.tel,
                    location: req.body.location,
                }
            })
            .then(user => {
                res.status(201).json({
                    message: 'User updated',
                    user: user
                })
            })
            .catch(err => {
                res.status(500).json({ error: err })
            })
        } else {
            res.status(500).json({ error: err })
        }
    })
    .catch(err => {
        res.status(500).json({ error: err })
    })
});

//Update profile with image
router.patch('/:userId/image', upload.single('profileImage'), (req, res, next) => {
    User.findById(req.params.userId)
        .exec()
        .then(user => {
            if (user) {
                User.updateOne({ _id: user._id }, {
                    $set: {
                        name: req.body.name,
                        profileImage: req.file.path,
                        email: req.body.email,
                        tel: req.body.tel,
                        location: req.body.location
                    }
                })
                .then(user => {
                    res.status(201).json({
                        message: 'User updated successfully',
                        user: user
                    })
                })
                .catch(err => {
                    res.status(500).json({ error: err })
                })
            } else {
                res.status(500).json({ error: err })
            }
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
});

// Make recommandation to every user when a project is validated
router.patch('/recommand/to/all', (req, res, next) => {
    User.updateMany({role: "user"}, {
        $push: {
            recommandations: req.body.rec,
        }
    })
    .then(user => {
        res.status(201).json({
            message: 'Recommandation saved successfully',
            user: user
        })
    })
    .catch(err => {
        res.status(500).json({ error: err })
    })
});


//Update password
router.patch('/:userId/password/update', (req, res, next) => {
    User.findById(req.params.userId)
        .exec()
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: 'EMAIL_NOT_EXIST'
                })
            }
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: 'WRONG_PASSWORD'
                    })
                }
                if (result) {
                    bcrypt.hash(req.body.newpassword, 10, (err, hash) => {
                        if (err) {
                            return res.status(500).json({
                                error: err
                            })
                        } else {
                            User.updateOne({ _id: user._id }, {
                                $set: {password: hash}
                            })
                            .then(user => {
                                res.status(201).json({
                                    message: 'User updated',
                                    user: user
                                })
                            })
                            .catch(err => {
                                res.status(500).json({ error: err })
                            })
                        }
                    })
                } else {
                    res.status(401).json({
                        message: 'WRONG_PASSWORD'
                    })
                }
            })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({ error: err })
        })
});

// Save images on user gallery
router.patch('/:id/galleryimages/save', (req, res, next) => {
    User.update({ _id: req.params.id }, {
        $push: {
            gallery: req.body.gallery,
        }
    })
    .then(user => {
        res.status(201).json({
            message: 'saved successfully',
            user: user
        })
    })
    .catch(err => {
        res.status(500).json({ error: err })
    })
});

// delete a user
router.delete('/:userId', (req, res, next) => {
    User.remove({ _id: req.params.userId })
        .exec()
        .then(result => {
            return res.status(200).json({
                message: "User deleted"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        })
});


// Get  a single user
router.get('/:userId', (req, res, next) => {
    User.findOne({ _id: req.params.userId })
        .exec()
        .then(user => {
            return res.status(200).json({
                user: user
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        })
});


// Detele an image from gallery
router.patch('/:id/gallery/delete', (req, res, next) => {
    User.updateOne({ _id: req.params.id }, {
        $set: { gallery: req.body.images }
    })
    .exec()
    .then(user => {
        return res.status(201).json({
            user: user
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Make a recommandation
router.patch('/:id/recommand', (req, res, next) => {
    User.updateOne({ _id: req.params.id }, {
        $push: { recommandations: req.body.rec }
    })
    .exec()
    .then(user => {
        return res.status(201).json({
            user: user
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})


// Set a visited notification to true
router.patch('/:id/notification/seen', (req, res, next) => {
    User.updateOne({ _id: req.params.id }, {
        $set: { recommandations: req.body.rec }
    })
    .exec()
    .then(user => {
        return res.status(201).json({
            user: user
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Get all users
router.get('/', (req, res, next) => {
    User.find({role: "user"}).sort({ $natural: -1 })
    .exec()
        .then(users => {
        return res.status(201).json({
            users: users
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Sanction user [By Admin]
router.patch('/:id/sanction/set', (req, res, next) => {
    const sanctionDate = req.body.sanctionDate;
    const userId = req.params.id;

    User.updateOne({ _id: userId }, {
        $set: { sanctionDateLimit: sanctionDate }
    })
    .exec()
    .then(user => {
        return res.status(201).json({
            user: user
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// count all users
router.get('/count/all', (req, res, next) => {
    User.find({ role: "user" }).count()
        .exec()
        .then(n => {
            return res.status(201).json({
                n: n
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

router.get('/pdf/download', (req, res, next) => {
    // Create a document
    const doc = new PDFDocument;

    // Pipe its output somewhere, like to a file or HTTP response
    // See below for browser usage
    doc.pipe(fs.createWriteStream('./uploads/coupons/doc.pdf'));

    // Embed a font, set the font size, and render some text


    // Add an image, constrain it to a given size, and center it vertically and horizontally
    doc.image('./uploads/logo/logo.png', 10, 20, {
        fit: [150, 80],
        align: 'center',  
        valign: 'center'
    }, { width: 150 });

    // Add another page
    doc.fontSize(16)
        .text("Reduction du prix d'entré", 170, 20, { lineGap : 2});
    doc.fillColor('red')
        .fontSize(14)
        .text("Coupon de réduction de 5%", 170, null, { lineGap: 2 });
    doc.fillColor('black')
        .fontSize(14)
        .text("Pour cette Annonce: Vente Make up tools Pour cette Annonce: Vente Make up tools", 170, null, { lineGap: 2 });
    doc.fontSize(10)
        .text("Offre valable jusqu'à 12 juillet sous présentation au guichet.", 170, null, { lineGap: 2 });

    doc.save() 
 
    // Finalize PDF file
    doc.end();
    return res.status(201).json({ 
        message: "PDF_CREATED"
    })
});


module.exports = router;