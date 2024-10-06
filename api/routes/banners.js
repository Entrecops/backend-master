const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const path = require("path");
const multer = require('multer')

const Banner = require('../models/banner');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/banner')
    },
    filename: function (req, file, cb) {
        cb(null, "entrecops-banner-" + Date.now() + path.extname(file.originalname))
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

// Upload banner images
router.post('/', upload.single('image'), (req, res, next) => {
    const banner = new Banner({
        _id: mongoose.Types.ObjectId(),
        link: req.file.path,
        isCurrent: false,
        date: new Date()
    });
    banner.save()
        .then(banner => {
            return res.status(201).json({
                message: 'UPLOADED',
                banner: banner
            })
        }).catch(err => {
            return res.status(500).json({ error: err })
        })
})

// Set images on banner
router.post('/set', (req, res, next) => {
    req.body.bannerImages.forEach((banner, i) => {
        const newBanner = new Banner({ 
            _id: mongoose.Types.ObjectId(), 
            link: banner.src, 
            followlink: banner.followlink, 
            title: banner.title, 
            date: new Date() });
        newBanner.save()
        .then(banner => {
            if(req.body.bannerImages.length === (i+1)) {
                return res.status(201).json({
                    banner: banner
                })
            }
        })
        .catch(err => {
            if(req.body.bannerImages.length === (i+1)) {
                return res.status(500).json({ error: err })
            }
        })
    });
})


// remove images on banner
router.patch('/remove', (req, res, next) => {
    req.body.bannerImages.forEach((banner, i) => {
        Banner.deleteOne({_id: banner.id})
        .exec()
        .then(banner => {
            if(req.body.bannerImages.length === (i+1)) {
                return res.status(201).json({
                    banner: banner
                })
            }
        })
        .catch(err => {
            if(req.body.bannerImages.length === (i+1)) {
                return res.status(500).json({ error: err })
            }
        })
    });
})

// Get current banner
router.get('/current', (req, res, next) => {
    Banner.find({})
    .exec()
    .then(banners => {
        return res.status(200).json({
            banners: banners
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})


// Get all banner images
router.get('/', (req, res, next) => {
    Banner.find({}).sort({ $natural: -1 })
    .exec()
    .then(banners => {
        return res.status(200).json({
            banners: banners
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Delete a banner
router.delete('/:bannerId', (req, res, next) => {
    Banner.remove({ _id: req.params.bannerId })
    .exec()
    .then(result => {
        return res.status(201).json({
            message: "Banner deleted",
            result: result
        })
    })
    .catch(err => {
        res.status(500).json({ error: err })
    })
})

module.exports = router;
