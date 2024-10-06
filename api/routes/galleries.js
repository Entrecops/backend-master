const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const path = require("path");
const multer = require('multer')
const ServiceCops = require('../models/service');
const EventCops = require('../models/event');

const Gallery = require('../models/gallery');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/gallery')
    },
    filename: function (req, file, cb) {
        cb(null, "entrecops-gallery-" + Date.now() + path.extname(file.originalname))
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
router.post('/publish', upload.array('images'), (req, res, next) => {
    const filesPath = req.files.map(file => file.path)
    const publication = new Gallery({
        _id: mongoose.Types.ObjectId(),
        content: req.body.content,
        tags: req.body.tags,
        images: filesPath,
        date: new Date()
    });
    publication.save()
        .then(publication => {
            return res.status(201).json({
                message: 'PUBLISHED',
                publication: publication
            })
        }).catch(err => {
            return res.status(500).json({ error: err })
        })
})

// Get all publications in gallery
router.get('/all', (req, res, next) => {
    Gallery.find({}).sort({ $natural: -1 })
        .exec()
        .then(publications => {
            return res.status(201).json({
                publications: publications
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

router.get('/:query/filter', (req, res, next) => {
    const query = req.params.query.toString()
    Gallery.find({ tags: new RegExp(query, 'i') })
        .exec()
        .then(publications => {
            return res.status(200).json({
                publications: publications
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})


router.get('/menus/all', (req, res, next) => {
    ServiceCops.find({ menu: { $exists: true } })
        .exec()
        .then(serviceWithMenu => {
            EventCops.find({ menu: { $exists: true } })
                .exec()
                .then( eventWithMenu => {
                    return res.status(200).json({
                        menus: [...eventWithMenu, ...serviceWithMenu]
                    })
                }).catch(err => {
                    return res.status(500).json({ error: err })
                })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

// Delete a publication on gallery
router.delete('/:id', (req, res, next) => {
    const id = req.params.id
    Gallery.remove({ _id: id })
        .exec()
        .then(publications => {
            return res.status(201).json({
                publications: publications
            })
        })
        .catch(err => {
            return res.status(500).json({ error: err })
        })
})

module.exports = router;
