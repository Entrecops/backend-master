const providers = ['google', 'facebook']
const {rootUrl} = require('./rootUrl')
const {apiUrl} = require('./rootUrl')
require('dotenv').config();

const callbacks = providers.map(provider => {
    return `${apiUrl}/api/auth/${provider}/callback`
})
const [googleURL, facebookURL] = callbacks

exports.CLIENT_ORIGIN = rootUrl

exports.GOOGLE_CONFIG = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: googleURL
}

exports.FACEBOOK_CONFIG = {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    profileFields: ['id', 'emails', 'name', 'picture.width(250)'],
    callbackURL: facebookURL
}
