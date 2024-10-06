const express = require('express')
const path = require("path");
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const bcrypt = require('bcrypt')

const User = require('../models/user');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/suppliersImages')
    },
    filename: function (req, file, cb) {
        cb(null, "supplier-" + Date.now() + path.extname(file.originalname))
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

// Supplier registration
router.post('/new', upload.single('profileImage'), (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            // Verify if there is already a suppier account with this email
            if (user) {
                if (user.role === "user") {
                    //Update the user with more supplier informations
                    User.updateOne({ _id: user._id }, {
                        $set: {
                            name: req.body.name,
                            profileImage: ( req.file != undefined ) ? req.file.path : user.profileImage,
                            tel: req.body.tel,
                            location: req.body.location,
                            services: req.body.services,
                            otherInfos: req.body.otherInfos,
                            mapLink: req.body.mapLink,
                            accountValidated: false,
                            role: "supplier",
                        }
                    })
                        .then(supplier => {
                            res.status(201).json({
                                message: 'Supplier saved successfully',
                                supplier: supplier
                            })
                        })
                        .catch(err => {
                            res.status(500).json({ error: err })
                        })
                } else {
                    return res.status(409).json({
                        message: 'EMAIL_EXIST'
                    })
                }
            } else {
                // Save new supplier
                const supplier = new User({
                    _id: mongoose.Types.ObjectId(),
                    name: req.body.name,
                    email: req.body.email,
                    profileImage: req.file.path,
                    tel: req.body.tel,
                    location: req.body.location,
                    services: req.body.services,
                    mapLink: req.body.mapLink,
                    otherInfos: req.body.otherInfos,
                    accountValidated: false,
                    role: "supplier",
                    date: new Date()
                })
                supplier.save()
                    .then(supplier => {
                        res.status(201).json({
                            message: 'Supplier saved successfully',
                            supplier: supplier
                        })
                    })
                    .catch(err => {
                        res.status(500).json({ error: err })
                    })
            }
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            })
        })
})

// Edit
router.post('/admin-edit', upload.single('profileImage'), (req, res, next) => {
    User.findOne({ email: req.body.oldEmail })
        .exec()
        .then(user => {
            // Verify if ther is already a suppier account with this email
            if (user) {
                if (user.role === "supplier") {
                    // Check if the new email cant be taken
                    User.findOne({ email: req.body.email }).exec().then( existingUser => {
                        if( existingUser && req.body.email != req.body.oldEmail ) {
                            return res.status(409).json({
                                message: 'EMAIL_EXIST'
                            });
                        } else {
                            //Update the user with more supplier informations
                            User.updateOne({ _id: user._id }, {
                                $set: {
                                    email: req.body.email,
                                    name: req.body.name,
                                    profileImage: ( req.file != undefined ) ? req.file.path : user.profileImage,
                                    tel: req.body.tel,
                                    location: req.body.location,
                                    services: req.body.services,
                                    otherInfos: req.body.otherInfos,
                                    mapLink: req.body.mapLink,
                                    accountValidated: user.accountValidated,
                                    role: "supplier",
                                }
                            }).then(supplier => {
                                res.status(201).json({
                                    message: 'Supplier saved successfully',
                                    supplier: supplier
                                })
                            })
                            .catch(err => {
                                res.status(500).json({ error: err })
                            })
                        }
                    });
                } else {
                    return res.status(409).json({
                        message: 'EMAIL_EXIST'
                    })
                }
            } else {
                return res.status(409).json({
                    message: 'SUPPLIER_DOES_NOT_EXIST'
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            })
        })
    })

// Get all suppliers
router.get('/all', (req, res, next) => {
    User.find({ "role": "supplier" })
    .exec().then(suppliers => {
        User.updateMany({"role": "supplier"}, { $set: { adminViewed: true}}).exec();
        return res.status(201).json({
            suppliers: suppliers
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Validate suppliers
router.patch('/validate/:id', (req, res, next) => {
    User.updateOne({ _id: req.params.id }, {
        $set: { accountValidated: true}
    })
    .exec()
    .then(supplier => {
        return res.status(201).json({
            supplier: supplier
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})


// update account after the acount have been validated
router.patch('/:id/confirmation', (req, res, next) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                error: err
            })
        } else {
            User.updateOne({ _id: req.params.id }, {
                $set: { password: hash}
            })
            .exec()
            .then(supplier => {
                return res.status(201).json({
                    supplier: supplier
                })
            })
            .catch(err => {
                return res.status(500).json({ error: err })
            })
        }
    })
})


// Get a single supplier
router.get('/:id', (req, res, next) => {
    User.findById(req.params.id)
    .exec()
    .then(supplier => {
        return res.status(201).json({
            supplier: supplier
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// count supplier
router.get('/count/all', (req, res, next) => {
    User.find({role: "supplier", accountValidated: true}).count()
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

module.exports = router;