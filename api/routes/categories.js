const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Category = require('../models/category');

// Create a category
router.post('/new', (req, res, next) => {
    const category = new Category({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name
    });
    category.save()
        .then(category => {
            return res.status(201).json({
                message: 'Category Created',
                category: category
            })
        }).catch(err => {
            return res.status(500).json({ error: err })
        })
})


// Get all categories
router.get('/all', (req, res, next) => {
    Category.find({})
    .exec()
    .then(categories => {
        return res.status(201).json({
            categories: categories
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err })
    })
})

// Delete a category
router.delete('/:categoryId', (req, res, next) => {
    Category.remove({ _id: req.params.categoryId })
    .exec()
    .then(result => {
        return res.status(200).json({
            message: "Category deleted",
            result: result
        })
    })
    .catch(err => {
        console.log(err)
        res.status(500).json({ error: err })
    })
})

module.exports = router;
