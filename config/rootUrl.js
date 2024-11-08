require('dotenv').config();

module.exports =( process.env.NODE_ENV == 'PRODUCTION' ) ? {
    rootUrl: 'http://38.242.233.127:3000',
    apiUrl: 'http://localhost:5000',
} : {
    rootUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8081'
}