const express = require('express')
const router = express.Router()
const passport = require('passport')
const authController = require('../lib/auth-controller')

// Setting up the passport middleware for each of the OAuth providers
const googleAuth = passport.authenticate('google', { scope: ['profile'] })
const facebookAuth = passport.authenticate('facebook')

// Routes that are triggered by the callbacks from each OAuth provider once 
// the user has authenticated successfully
router.get('/google/callback', googleAuth, authController.google)
router.get('/facebook/callback', facebookAuth, authController.facebook)

// This custom middleware allows us to attach the socket id to the session
// With that socket id we can send back the right user info to the right 
// socket
router.use((req, res, next) => {
    req.session.socketId = req.query.socketId
    next()
})

// Routes that are triggered on the client
router.get('/google', googleAuth)
router.get('/facebook', facebookAuth)

module.exports = router